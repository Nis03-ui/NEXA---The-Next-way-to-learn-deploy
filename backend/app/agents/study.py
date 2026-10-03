import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult, BaseAgent
from app.services.gemini import GeminiClient


class StudyAgent(BaseAgent):
    """
    NEXA educational tutoring agent.

    Supported modes:
        normal  - general tutoring
        explain - concept explanation
        study   - guided learning
        code    - programming assistance
        quiz    - active recall
    """

    name = "study"

    def __init__(self, gemini: GeminiClient):
        super().__init__(gemini)

    def get_mode_instruction(self, mode: str) -> str:
        instructions = {
            "explain": """
TUTOR MODE: EXPLAIN

Make the requested concept easy to understand.

Teaching approach:
1. Start with a simple definition.
2. Explain the idea in plain language.
3. Break it into logical parts.
4. Use a real-world analogy when useful.
5. Give a concrete technical example.
6. Explain common misconceptions.
7. End with a short recap.

Focus on genuine understanding rather than memorization.
""",
            "study": """
TUTOR MODE: STUDY WITH ME

Act as an interactive study partner.

Teaching approach:
1. Break the topic into manageable steps.
2. Teach one important idea at a time.
3. Use examples and explanations.
4. Check understanding when appropriate.
5. Ask short active-recall questions.
6. Connect new ideas to previous concepts.
7. Gradually increase difficulty.

Do not dump a large lecture on the student.

Make the interaction feel like guided learning.
""",
            "code": """
TUTOR MODE: CODE

Help the student understand programming and code.

Teaching approach:
1. Explain what the code is trying to accomplish.
2. Explain important parts step by step.
3. Explain control flow and data flow.
4. Identify important programming concepts.
5. Point out bugs or problems when relevant.
6. Explain why the code works or does not work.
7. Provide corrected code when useful.
8. Keep code clean and properly formatted.

Prioritize reasoning and understanding before giving a solution.

Never assume the student understands advanced concepts.
""",
            "quiz": """
TUTOR MODE: QUIZ

Act as an interactive tutor who tests understanding.

Rules:
1. Ask one question at a time.
2. Start at an appropriate difficulty.
3. Wait for the student's answer before revealing the solution.
4. Evaluate the answer fairly.
5. Explain what was correct.
6. Correct misunderstandings clearly.
7. Increase difficulty when appropriate.
8. Use conceptual, multiple-choice, short-answer,
   problem-solving, or code-reasoning questions.

Do not immediately reveal the answer.

The goal is active recall and understanding.
""",
            "normal": """
TUTOR MODE: NORMAL

Provide helpful educational tutoring.

Teaching principles:
1. Explain concepts clearly and logically.
2. Prefer understanding over memorization.
3. Use simple examples when useful.
4. Break difficult concepts into smaller steps.
5. Explain programming reasoning before code.
6. Show important mathematical steps.
7. Use headings and bullets when useful.
8. Adapt to the student's apparent level.
9. Ask for clarification when the question is ambiguous.
10. Never fabricate information.
""",
        }

        return instructions.get(mode, instructions["normal"])

    def clean_response(self, answer: str) -> str:
        """Normalize common Gemini formatting artifacts."""

        languages = (
            r"python|javascript|typescript|java|csharp|c#|cpp|c\+\+|"
            r"go|rust|php|ruby|bash|shell|sql|html|css"
        )

        # Convert a standalone language name followed by an
        # unlabeled Markdown code fence into a labelled fence.
        answer = re.sub(
            rf"(?im)^[ \t]*({languages})[ \t]*\n"
            rf"(?:[ \t]*\n)?[ \t]*```[ \t]*$",
            r"```\1",
            answer,
        )

        # Remove duplicate language labels when the fence
        # is already labelled.
        answer = re.sub(
            rf"(?im)^[ \t]*({languages})[ \t]*\n"
            rf"(?:[ \t]*\n)?[ \t]*(```(?:{languages}))[ \t]*$",
            r"\2",
            answer,
        )

        # Remove standalone "code" or "example" labels
        # immediately before a fenced block.
        answer = re.sub(
            r"(?im)^[ \t]*(?:code|example)[ \t]*\n"
            r"(?:[ \t]*\n)?[ \t]*```",
            "```",
            answer,
        )

        # Collapse excessive blank lines.
        answer = re.sub(r"\n{3,}", "\n\n", answer)

        return answer.strip()

    async def run(
        self,
        message: str,
        conversation: str = "",
        db: AsyncSession | None = None,
        mode: str = "normal",
        user_id: int | None = None,
    ) -> AgentResult:
        """Generate an educational response using Gemini."""

        mode_instruction = self.get_mode_instruction(mode)

        system_instruction = f"""
You are NEXA, an AI educational tutor for college students.

Your primary goal is to help students understand concepts deeply
rather than simply giving them answers.

{mode_instruction}

RESPONSE FORMATTING RULES:

1. Use Markdown for your response.

2. Use headings when they improve readability.

3. Use bullet points or numbered lists when appropriate.

4. Use inline code with single backticks for short code,
   variables, functions, classes, commands, and technical terms.

5. Always use fenced Markdown code blocks for multi-line code.

6. When showing code, put the programming language directly
   after the opening Markdown fence.

7. Never write a programming language name on a separate line
   immediately before a code block.

8. Do not write standalone labels such as:
   python
   javascript
   typescript
   java
   code
   example

   immediately before a fenced code block.

9. Keep explanations clear and appropriately concise.

10. Prefer practical examples when they improve understanding.

11. Do not unnecessarily repeat the same explanation.

12. Never fabricate information.

13. Adapt the explanation to the student's apparent level.

14. For programming questions, explain the reasoning before
    presenting a complete solution when appropriate.

The student's recent conversation is:

{conversation}
"""

        answer = await self.gemini.generate(
            prompt=message,
            system_instruction=system_instruction,
        )

        cleaned_answer = self.clean_response(answer)

        return AgentResult(
            answer=cleaned_answer,
            agent=self.name,
        )