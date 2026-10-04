from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_token,
    current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserOut,
    VerificationResponse,
    VerifyEmailRequest,
)
from app.services.auth import (
    create_auth_session,
    revoke_refresh_token,
    rotate_refresh_token,
)
from app.services.email import send_email
from app.services.email_verification import (
    create_email_verification_token,
    verify_email,
)
from app.services.password_reset import (
    create_password_reset_token,
    reset_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


# ============================================================
# Current User
# ============================================================

@router.get(
    "/me",
    response_model=UserOut,
)
async def get_current_user(
    user: User = Depends(current_user),
):
    return user


# ============================================================
# Forgot Password
# ============================================================

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    generic_message = (
        "If an account exists for that email, "
        "a password reset link has been sent."
    )

    user = (
        await db.execute(
            select(User).where(
                User.email == data.email
            )
        )
    ).scalar_one_or_none()

    # Never reveal whether the email is registered.
    if user is None:
        return ForgotPasswordResponse(
            message=generic_message,
        )

    reset_token = await create_password_reset_token(
        user=user,
        db=db,
    )

    reset_url = (
        f"{settings.frontend_origin}/reset-password"
        f"?token={reset_token}"
    )

    try:
        await send_email(
            to_email=user.email,
            subject="Reset your NEXA password",
            html_content=f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <div style="max-width: 560px; margin: 0 auto; padding: 32px;">
                  <h1 style="margin-bottom: 8px;">NEXA</h1>

                  <p>Hello {user.name},</p>

                  <p>
                    We received a request to reset the password
                    for your NEXA account.
                  </p>

                  <p>
                    <a
                      href="{reset_url}"
                      style="
                        display: inline-block;
                        padding: 12px 20px;
                        background: #0f172a;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                      "
                    >
                      Reset password
                    </a>
                  </p>

                  <p>
                    This link will expire after
                    {settings.password_reset_expire_minutes} minutes.
                  </p>

                  <p>
                    If you did not request a password reset,
                    you can safely ignore this email.
                  </p>

                  <p>
                    — NEXA<br />
                    The Next Way to Learn
                  </p>
                </div>
              </body>
            </html>
            """,
        )

        # Only persist the reset token after the email
        # has been successfully handed to the SMTP server.
        await db.commit()

    except Exception as exc:
        await db.rollback()

        # Log the actual SMTP failure server-side for debugging.
        # Never expose provider details to the client.
        print(
            f"[PASSWORD RESET EMAIL ERROR] "
            f"{type(exc).__name__}: {exc}"
        )

        return ForgotPasswordResponse(
            message=generic_message,
        )

    return ForgotPasswordResponse(
        message=generic_message,
    )


# ============================================================
# Reset Password
# ============================================================

@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
async def reset_user_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        await reset_password(
            token=data.token,
            new_password=data.new_password,
            db=db,
        )

    except ValueError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    await db.commit()

    return MessageResponse(
        message="Password reset successfully",
    )


# ============================================================
# Email Verification
# ============================================================

@router.post(
    "/verify-email",
    response_model=VerificationResponse,
)
async def verify_user_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        await verify_email(
            token=data.token,
            db=db,
        )

    except ValueError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    await db.commit()

    return VerificationResponse(
        message="Email verified successfully",
    )


@router.post(
    "/resend-verification",
    response_model=VerificationResponse,
)
async def resend_verification(
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    user = (
        await db.execute(
            select(User).where(
                User.email == data.email
            )
        )
    ).scalar_one_or_none()

    # Do not reveal whether an email exists.
    if user is None:
        return VerificationResponse(
            message=(
                "If the account exists and is not verified, "
                "a verification token has been created."
            )
        )

    if user.email_verified:
        return VerificationResponse(
            message="Email is already verified",
        )

    verification_token = await create_email_verification_token(
        user=user,
        db=db,
    )

    verification_url = (
        f"{settings.frontend_origin}/verify-email"
        f"?token={verification_token}"
    )

    try:
        await send_email(
            to_email=user.email,
            subject="Verify your NEXA email address",
            html_content=f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <div style="max-width: 560px; margin: 0 auto; padding: 32px;">
                  <h1>NEXA</h1>
                  <p>Hello {user.name},</p>
                  <p>Please verify your email address to activate your NEXA account.</p>
                  <p>
                    <a href="{verification_url}"
                       style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
                      Verify my email
                    </a>
                  </p>
                  <p>This link expires after {settings.email_verification_expire_minutes} minutes.</p>
                </div>
              </body>
            </html>
            """,
        )
        await db.commit()
    except Exception as exc:
        await db.rollback()
        print(f"[EMAIL VERIFICATION ERROR] {type(exc).__name__}: {exc}")

    return VerificationResponse(
        message="Verification email sent. Please check your inbox.",
    )


# ============================================================
# Register
# ============================================================

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(
            data.password
        ),
        role=data.role,
        email_verified=False,
    )

    db.add(user)

    try:
        await db.commit()
        await db.refresh(user)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create account with this email.",
        ) from exc

    verification_token = await create_email_verification_token(
        user=user,
        db=db,
    )

    verification_url = (
        f"{settings.frontend_origin}/verify-email"
        f"?token={verification_token}"
    )

    try:
        await send_email(
            to_email=user.email,
            subject="Verify your NEXA email address",
            html_content=f"""\
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
    <div style="max-width: 560px; margin: 0 auto; padding: 32px;">
      <h1>NEXA</h1>
      <p>Hello {user.name},</p>
      <p>Welcome to NEXA. Verify your email address to activate your account.</p>
      <p>
        <a href="{verification_url}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Verify my email
        </a>
      </p>
      <p>This link expires after {settings.email_verification_expire_minutes} minutes.</p>
      <p>— NEXA<br />The Next Way to Learn</p>
    </div>
  </body>
</html>
""",
        )
        await db.commit()
    except Exception as exc:
        await db.rollback()
        print(f"[EMAIL VERIFICATION ERROR] {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification email. Please try again.",
        ) from exc

    return RegisterResponse(
        message="Account created. Check your email to verify your account.",
    )


# ============================================================
# Login
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = (
        await db.execute(
            select(User).where(
                User.email == data.email
            )
        )
    ).scalar_one_or_none()

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in.",
        )

    refresh_token, _ = await create_auth_session(
        user=user,
        db=db,
        user_agent=request.headers.get("user-agent"),
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
    )

    access_token = create_token(
        user.id
    )

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


# ============================================================
# Refresh Token
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
async def refresh(
    data: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        (
            user,
            access_token,
            refresh_token,
        ) = await rotate_refresh_token(
            refresh_token=data.refresh_token,
            db=db,
            user_agent=request.headers.get("user-agent"),
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
        )

    except ValueError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


# ============================================================
# Logout
# ============================================================

@router.post(
    "/logout",
    response_model=MessageResponse,
)
async def logout(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    revoked = await revoke_refresh_token(
        refresh_token=data.refresh_token,
        db=db,
    )

    await db.commit()

    if not revoked:
        return MessageResponse(
            message="Session already logged out",
        )

    return MessageResponse(
        message="Logged out successfully",
    )