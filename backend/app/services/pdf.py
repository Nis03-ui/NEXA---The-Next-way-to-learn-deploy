from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader


MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB


class PDFExtractionService:
    """
    Extract text from uploaded PDF documents.

    The current implementation supports text-based PDFs.
    Scanned/image-only PDFs are rejected because OCR is not
    part of the current NEXA scope.
    """

    async def extract(
        self,
        file: UploadFile,
    ) -> tuple[str, int]:

        filename = file.filename or ""

        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported.",
            )

        if file.content_type not in {
            "application/pdf",
            "application/octet-stream",
            None,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF content type.",
            )

        data = await file.read()

        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF is empty.",
            )

        if len(data) > MAX_PDF_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="PDF file size must not exceed 10 MB.",
            )

        try:
            reader = PdfReader(BytesIO(data))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is not a valid PDF.",
            ) from exc

        if not reader.pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The PDF does not contain any pages.",
            )

        pages: list[str] = []

        for page in reader.pages:
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""

            text = text.strip()

            if text:
                pages.append(text)

        extracted_text = "\n\n".join(pages).strip()

        if not extracted_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "No readable text was found in this PDF. "
                    "Scanned or image-only PDFs are not supported yet."
                ),
            )

        return extracted_text, len(reader.pages)