# 2026GPTees - AI-Powered Custom Apparel Platform

Welcome to 2026GPTees, a full-stack e-commerce platform that combines AI design generation with custom apparel printing and fulfillment.

## 🚀 Features

- **AI-Powered Design Generation**: Create unique t-shirt designs using OpenAI's DALL-E 3
- **Pay-First Model**: Secure payment before design generation
- **Tiered Pricing**:
  - Basic ($24.99): 1 design generation
  - Premium ($34.99): Unlimited design generations
- **Multiple Style Options**: Modern, Vintage, Artistic, Playful, Professional, Trendy
- **Printful Integration**: Automated order fulfillment and shipping
- **Email Notifications**: Order confirmations, design approvals, shipping updates
- **Secure Authentication**: Powered by Clerk
- **Payment Processing**: Stripe integration with webhooks
- **Image Storage**: Supabase Storage with thumbnail generation
- **Responsive Design**: Mobile-first UI with dark mode support

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.20.0
- **Authentication**: Clerk Backend SDK
- **Payments**: Stripe SDK
- **AI**: OpenAI SDK (DALL-E 3)
- **Storage**: Supabase Storage + Sharp
- **Fulfillment**: Printful API
- **Email**: Resend SDK

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5+
- **Language**: TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS 4+
- **Authentication**: Clerk React SDK

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database (Supabase recommended)
- API keys for: Clerk, Stripe, OpenAI, Printful, Resend

## 🔧 Installation

See detailed setup instructions in [INSTALLATION.md](INSTALLATION.md)

## 📚 Project Structure

```
2026gptees/
├── backend/          # Express.js API server
├── frontend/         # React + Vite application
└── README.md
```

## 🔄 User Flow

1. Browse Products → Select product, size, color, tier
2. Checkout → Secure payment via Stripe
3. Generate Design → Enter prompt, choose style
4. Review & Approve → View AI-generated design
5. Fulfillment → Automatic submission to Printful
6. Shipping → Track via email updates

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## 📄 License

MIT License - See LICENSE file for details.

## 📞 Support

- Email: support@2026gptees.app
- Issues: [GitHub Issues](https://github.com/yourusername/2026gptees/issues)

---

Built with ❤️ using AI
