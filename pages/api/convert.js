export const config = {
  api: {
    bodyParser: true
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt = 'A cartoon portrait of a Saudi man in a white thobe and ghutra' } = req.body;

    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'db21e45a3f1664c826c0ad646d9b3d34b4509f7c8f8b6d00e5c6f05644b6222c', // stable-diffusion
        input: {
          prompt,
          width: 512,
          height: 512
        }
      })
    });

    const prediction = await predictionRes.json();

    if (!prediction?.id) {
      throw new Error('لم يتم استلام معرف العملية من Replicate');
    }

    // Polling
    let result = null;
    for (let i = 0; i < 20; i++) {
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      const pollData = await pollRes.json();

      if (pollData.status === 'succeeded') {
        result = pollData.output;
        break;
      } else if (pollData.status === 'failed') {
        throw new Error('فشل توليد الصورة من Replicate');
      }

      await sleep(2000); // انتظر 2 ثانية
    }

    if (!result) {
      throw new Error('انتهى وقت الانتظار دون الحصول على نتيجة');
    }

    return res.status(200).json({ imageUrl: result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع' });
  }
}
