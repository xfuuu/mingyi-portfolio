export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check admin token
    const formData = await request.formData();
    const token = formData.get('token');

    if (!token || token !== env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid admin token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get form data
    const category = formData.get('category'); // 'artworks' or 'photography'
    const title = formData.get('title');
    const year = formData.get('year');
    const date = formData.get('date');
    const medium = formData.get('medium');
    const dimensions = formData.get('dimensions');
    const price = formData.get('price');
    const description = formData.get('description');
    const featured = formData.get('featured') === 'true';
    const available = formData.get('available') !== 'false';
    const image = formData.get('image');

    if (!image || !title || !category) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing required fields: image, title, category'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID and filename
    const timestamp = Date.now();
    const id = `${category === 'artworks' ? 'mz' : 'ph'}-${timestamp}`;
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const imageName = `${sanitizedTitle}_${timestamp}.jpg`;

    // Upload to R2
    if (env.ARTWORKS_BUCKET) {
      const imageBuffer = await image.arrayBuffer();
      
      // Upload original image
      await env.ARTWORKS_BUCKET.put(
        `${category}/${imageName}`,
        imageBuffer,
        {
          httpMetadata: {
            contentType: image.type || 'image/jpeg'
          }
        }
      );
    }

    // Determine paths (will be served from R2 via custom domain or Cloudflare Images)
    const imagePath = `assets/${category}/${imageName}`;
    const thumbPath = `assets/${category}/thumbs/${imageName}`;

    // Create new artwork object
    const newArtwork = {
      id,
      title,
      year: year ? parseInt(year) : null,
      date,
      medium,
      dimensions,
      price: price ? parseInt(price) : null,
      available,
      category: category === 'artworks' ? 'painting' : 'photography',
      thumbnail: thumbPath,
      images: [imagePath],
      description: description || '',
      featured
    };

    // Update GitHub data.json if credentials are provided
    if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
      try {
        await updateGitHubDataJson(env, newArtwork);
      } catch (error) {
        console.error('GitHub update failed:', error);
        // Continue even if GitHub update fails
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      item: newArtwork,
      message: 'Artwork uploaded successfully!',
      imageUrl: `https://pub-${env.R2_PUBLIC_URL || 'your-r2-bucket'}.r2.dev/${category}/${imageName}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateGitHubDataJson(env, newArtwork) {
  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = env;
  const dataPath = 'data.json';
  
  // Get current data.json
  const getResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${dataPath}?ref=${GITHUB_BRANCH}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker'
      }
    }
  );

  if (!getResponse.ok) {
    throw new Error('Failed to fetch data.json from GitHub');
  }

  const fileData = await getResponse.json();
  const currentContent = JSON.parse(atob(fileData.content));

  // Add new artwork at the beginning
  currentContent.unshift(newArtwork);

  // Update file on GitHub
  const updateResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${dataPath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloudflare-Worker',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add new artwork: ${newArtwork.title}`,
        content: btoa(JSON.stringify(currentContent, null, 2)),
        sha: fileData.sha,
        branch: GITHUB_BRANCH
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Failed to update data.json on GitHub');
  }

  return true;
}