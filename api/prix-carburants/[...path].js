const UPSTREAM_ORIGIN = "https://data.economie.gouv.fr";

const buildUpstreamUrl = (req) => {
  const pathSegments = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];

  const pathname = `/${pathSegments.join("/")}`;
  const queryIndex = req.url.indexOf("?");
  const query = queryIndex >= 0 ? req.url.slice(queryIndex) : "";

  return `${UPSTREAM_ORIGIN}${pathname}${query}`;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const upstreamUrl = buildUpstreamUrl(req);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        accept: req.headers.accept || "application/json",
      },
    });

    const body = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type");

    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    res.setHeader("cache-control", "s-maxage=120, stale-while-revalidate=300");
    res.status(upstreamResponse.status).send(body);
  } catch (error) {
    res.status(502).json({
      error: "Upstream fetch failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
