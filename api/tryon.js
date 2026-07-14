const MODEL_ID = 'fal-ai/idm-vton';
const FAL_BASE = 'https://queue.fal.run/' + MODEL_ID;

// Dùng queue API (bất đồng bộ) của fal.ai thay vì gọi đồng bộ,
// vì model AI thử đồ thường mất 10-30s, dễ vượt timeout của serverless function.
export default async function handler(req, res) {
    if (!process.env.FAL_API_KEY) {
        return res.status(500).json({ error: { message: 'FAL_API_KEY chưa được cấu hình trên server' } });
    }
    const authHeader = { 'Authorization': `Key ${process.env.FAL_API_KEY}` };

    try {
        if (req.method === 'POST') {
            const { humanImage, garmentImageUrl, description } = req.body || {};
            if (!humanImage || !garmentImageUrl) {
                return res.status(400).json({ error: { message: 'Thiếu ảnh khách hàng hoặc ảnh sản phẩm' } });
            }

            const response = await fetch(FAL_BASE, {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    human_image_url: humanImage,
                    garment_image_url: garmentImageUrl,
                    description: description || 'a clothing item'
                })
            });
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json(data);
            return res.status(200).json({ requestId: data.request_id });
        }

        if (req.method === 'GET') {
            const { action, id } = req.query;
            if (!id) return res.status(400).json({ error: { message: 'Thiếu request id' } });

            const path = action === 'result' ? `/requests/${id}` : `/requests/${id}/status`;
            const response = await fetch(FAL_BASE + path, { headers: authHeader });
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json(data);
            return res.status(200).json(data);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
    }
}
