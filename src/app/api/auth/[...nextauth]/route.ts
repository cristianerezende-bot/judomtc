import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
const allowedDomains = (process.env.ALLOWED_DOMAINS ?? '')
  .split(',').map(d => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean)

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = (user.email ?? '').toLowerCase()
      if (!email) return false
      if (allowedEmails.includes(email)) return true
      const domain = email.split('@')[1] ?? ''
      return allowedDomains.includes(domain)
    },
    async session({ session }) {
      return session
    },
  },
  pages: { signIn: '/login' },
})

export { handler as GET, handler as POST }
