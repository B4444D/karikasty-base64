// pages/api/generate.js
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = '/tmp';
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) throw new Error('فشل قراءة الصورة');

      const imageFile = files.image?.[0];
      if (!imageFile) throw new Error('لم يتم استقبال الصورة');

      const prompt = fields.prompt?.[0] || 'A soft cartoon portrait of a Saudi man in traditional attire, clean white background';
      const outputType = fields.outputType?.[0] || 'image';
      const imagePath = imageFile.filepath;

      const imageBuffer = fs.readFileSync(imagePath).toString('base64');
      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
        method: 'POST',
        body: new URLSearchParams({ image: imageBuffer })
      });

      const imgbbData = await imgbbRes.json();
      if (!imgbbData.success) throw new Error('فشل رفع الصورة إلى imgbb');

      const imageUrl = imgbbData.data.url;

      const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: '20c352f1e123e5f5f9c2ac5745d60c81d87d5cf01acafc956d04329e753d0b3e',
          input: { image: imageUrl, prompt }
        })
      });

      const repData = await replicateRes.json();
      if (!repData?.output) throw new Error('فشل توليد الصورة من Replicate');

      let finalImage = repData.output;

      if (outputType === 'sticker') {
        const removeRes = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY },
          body: new URLSearchParams({ image_url: finalImage, size: 'auto' })
        });

        if (!removeRes.ok) throw new Error('فشل إزالة الخلفية');

        const buffer = await removeRes.arrayBuffer();
        finalImage = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
      }

      return res.status(200).json({ imageUrl: finalImage });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'حدث خطأ غير متوقع' });
    }
  });
}
