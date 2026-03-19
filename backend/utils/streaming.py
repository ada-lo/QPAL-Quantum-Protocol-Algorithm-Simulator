import json
from typing import AsyncGenerator, Any

async def sse_stream(generator) -> AsyncGenerator[str, None]:
    async for data in generator:
        yield f"data: {json.dumps(data)}\n\n"
    yield "data: [DONE]\n\n"
