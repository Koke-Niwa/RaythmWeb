const BLOCKED_PATHS = new Set([
  '/submission',
  '/submission/',
  '/submission.html'
]);

export const onRequest = async ({ request, env, next }) => {
  const pathname = new URL(request.url).pathname;
  if (!BLOCKED_PATHS.has(pathname)) return next();

  const notFoundUrl = new URL('/404.html', request.url);
  const notFound = await env.ASSETS.fetch(notFoundUrl);
  return new Response(notFound.body, {
    status: 404,
    headers: notFound.headers
  });
};
