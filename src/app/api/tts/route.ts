import { NextRequest, NextResponse } from 'next/server';

// Voice ID mặc định của ElevenLabs: Rachel (Giọng nữ bản xứ tiếng Anh trong sáng, chuẩn CEFR)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId = DEFAULT_VOICE_ID } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung văn bản không được để trống' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Trường hợp chưa cấu hình API Key: Trả về cờ fallback để client chuyển sang Web Speech API
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Chưa cấu hình ELEVENLABS_API_KEY',
          fallback: true,
        },
        { status: 404 }
      );
    }

    // Gọi ElevenLabs API với model eleven_turbo_v2_5 (độ trễ siêu thấp)
    const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 1000), // Giới hạn an toàn
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text();
      console.warn('[ElevenLabs API Error]:', elevenLabsRes.status, errText);
      return NextResponse.json(
        {
          error: `ElevenLabs API trả về mã ${elevenLabsRes.status}`,
          fallback: true,
        },
        { status: elevenLabsRes.status }
      );
    }

    // Nhận stream audio dạng mpeg và trả về client kèm header Cache-Control
    const audioArrayBuffer = await elevenLabsRes.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        // Cache âm thanh trên browser và CDN trong 24 giờ
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error: any) {
    console.error('[API TTS Handler Error]:', error);
    return NextResponse.json(
      {
        error: error.message || 'Lỗi xử lý chuyển đổi văn bản thành giọng nói',
        fallback: true,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const voiceId = searchParams.get('voiceId') || DEFAULT_VOICE_ID;

  if (!text) {
    return NextResponse.json({ error: 'Param text không được trống' }, { status: 400 });
  }

  // Chuyển hướng xử lý vào POST logic
  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })
  );
}

