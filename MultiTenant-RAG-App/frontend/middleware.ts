import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return token != null;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/documents/:path*',
    '/conversations/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};