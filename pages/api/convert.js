export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt = 'A cartoon portrait of a Saudi man in a white thobe and ghutra' } = req.body;

    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
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

    const data = await replicateRes.json();
    console.log("🔍 رد Replicate:", JSON.stringify(data));

    if (!data || data.error || !data.output) {
      throw new Error('فشل توليد الصورة من Replicate');
    }

    return res.status(200).json({ imageUrl: data.output });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع' });
  }
}
