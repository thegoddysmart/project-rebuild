# EaseVote

**EaseVote** is a modern, reliable platform designed for seamless event voting and ticketing experiences. Built with performance and user experience in mind, it provides a secure environment for casting votes and purchasing polls or event tickets.

## 🚀 Features

- **Live Voting System**: Users can browse active events, select nominees across categories, and cast votes with real-time feedback.
- **Event Ticketing**: A smooth flow for purchasing event tickets, complete with seat selection (UI) and digital ticket generation.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices using a mobile-first approach.
- **TrustCenter**: Integrated legal compliance, privacy policies, and terms of service management.
- **Dynamic Search & Filtering**: Real-time filtering of events and nominees.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📦 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (Preferred package manager)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/easevote.git
    cd easevote
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm dev
    ```

4.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Building for Production

To create an optimized production build:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

## 📂 Project Structure

```text
├── app/                  # Application routes (Next.js App Router)
│   ├── (auth)/           # Authentication routes (Sign-up, etc.)
│   ├── (main)/           # Main application layouts and pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── features/         # Feature-specific components (Voting, Tickets)
│   ├── layout/           # Layout components (Header, Footer)
│   └── ui/               # Core UI elements (Buttons, Inputs)
├── constants/            # Mock data and configuration constants
├── public/               # Static assets (Images, Icons)
└── types.ts              # Global TypeScript definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary software. All rights reserved.
