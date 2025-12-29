export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

export interface Event {
  id: string;
  title: string;
  category:
    | "Awards"
    | "Pageantry"
    | "School"
    | "Concert"
    | "Sports"
    | "Tech"
    | "Lifestyle"
    | "Education"
    | "Corporate"
    | "Theater";
  image: string;
  date: string;
  votes?: number;
  status: "Live" | "Upcoming" | "Ended";
  price?: string;
  votePrice?: number; // Cost per vote
  location?: string;
  eventCode?: string;
  description?: string;
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful?: number;
}

export interface VideoGuide {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string;
  category: string;
  image: string;
  readTime: string;
}

export interface Candidate {
  id: string;
  name: string;
  image: string;
  code: string;
  category?: string;
  voteCount?: number;
  votes?: number;
}

export interface Category {
  id: string;
  name: string;
  candidates: Candidate[];
  totalVotes?: number;
}

export interface VotingEvent extends Event {
  eventCode: string;
  organizer: string;
  description: string;
  categories: Category[];
  totalVotes: number;
  isNominationOpen?: boolean;
  isVotingOpen?: boolean;
  timelineEnd?: string | null;
  phase?: string;
  showLiveResults?: boolean;
  showVoteCount?: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  description?: string;
  features?: string[];
}

export interface TicketingEvent extends Event {
  eventCode: string;
  organizer: string;
  description: string;
  venue: string;
  time: string;
  ticketTypes: TicketType[];
}
