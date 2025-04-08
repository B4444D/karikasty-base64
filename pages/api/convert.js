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
        version: 'a9758cbf62b4c927f1f2fda0c1fef1be28a90f29fb36cd87a7bfa01e6a8ba0a3', // stable-diffusion
        input: {
          prompt,
          width: 512,
          height: 512
        }
      })
    });

    const prediction = await predictionRes.json();
    console.log('📦 رد Replicate:', prediction);

    if (!prediction?.id) {
      throw new Error('لم يتم استلام معرف العملية من Replicate');
    }

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

      await sleep(2000);
    }

    if (!result) {
      throw new Error('انتهى وقت الانتظار دون الحصول على نتيجة');
    }

    return res.status(200).json({ imageUrl: result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع' });
  }
}
