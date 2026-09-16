import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o";

const SYSTEM_PROMPT = `Bạn là **Trợ lý Năng suất AI** cho ứng dụng quản lý dự án DoneIt.
Ngôn ngữ: Tiếng Việt.
Phong cách: Chuyên nghiệp, thân thiện, thực tế.
Nhiệm vụ: Giúp người dùng tóm tắt công việc, phân tích ưu tiên, lập kế hoạch, giải đáp thắc mắc về quản lý dự án/nhiệm vụ.
Khi trả lời, hãy dùng markdown (bold, bullet points) để dễ đọc.`;

export async function POST(request: NextRequest) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
  console.log("API Key present:", !!OPENROUTER_API_KEY, "Length:", OPENROUTER_API_KEY.length);
  
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'message' field" },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (context) {
      messages.push({
        role: "system",
        content: `Ngữ cảnh người dùng:\n${context}`,
      });
    }

    messages.push({ role: "user", content: message });

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": request.headers.get("origin") ?? "http://localhost:3000",
        "X-Title": "DoneIt Task Management",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter error:", response.status, errorData);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "Xin lỗi, mình không nhận được phản hồi từ mô hình AI.";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("OpenRouter proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}