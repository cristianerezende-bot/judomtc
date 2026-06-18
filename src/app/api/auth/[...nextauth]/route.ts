import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const allowedEmails = (process.env.ALLOWED_EMAILS ?? '').split(',').map(e => e.trim())

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return allowedEmails.includes(user.email ?? '')
    },
    async session({ session }) {
      return session
    },
  },
  pages: { signIn: '/login' },
})

export { handler as GET, handler as POST }
