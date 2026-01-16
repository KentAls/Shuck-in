/** @type {import('@hellocoop/nextjs').Config} */
const config = {
  client_id: process.env.HELLO_CLIENT_ID,
  // Request these scopes/claims from Hello
  scope: ['openid', 'name', 'email', 'picture'],
  // Callback routes
  routes: {
    loggedIn: '/dashboard',
    loggedOut: '/',
    error: '/auth/error',
  },
  // Callbacks for user management
  callbacks: {
    // Called after successful login - sync user to database
    async loggedIn({ token, payload }) {
      // The token contains: sub, name, email, picture
      // You can sync to your database here if needed
      return true;
    },
  },
};

module.exports = config;
