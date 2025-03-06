import { BadgeCheck, BookOpenIcon, BotMessageSquare, ChartBar, Clock, PlayCircle, Users } from "lucide-react";
import { BatteryCharging } from "lucide-react";
import { Fingerprint } from "lucide-react";
import { ShieldHalf } from "lucide-react";
import { PlugZap } from "lucide-react";
import { GlobeLock } from "lucide-react";

import user1 from "../assets/profile-pictures/user1.jpg";
import user2 from "../assets/profile-pictures/user2.jpg";
import user3 from "../assets/profile-pictures/user3.jpg";
import user4 from "../assets/profile-pictures/user4.jpg";
import user5 from "../assets/profile-pictures/user5.jpg";
import user6 from "../assets/profile-pictures/user6.jpg";

export const navItems = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Programs", href: "#" },
  { label: "Contact", href: "#" },
];

export const testimonials = [
  {
    user: "John Doe",
    company: "Stellar Solutions",
    image: user1,
    text: "I am extremely satisfied with the services provided. The team was responsive, professional, and delivered results beyond my expectations.",
  },
  {
    user: "Jane Smith",
    company: "Blue Horizon Technologies",
    image: user2,
    text: "I couldn't be happier with the outcome of our project. The team's creativity and problem-solving skills were instrumental in bringing our vision to life",
  },
  {
    user: "David Johnson",
    company: "Quantum Innovations",
    image: user3,
    text: "Working with this company was a pleasure. Their attention to detail and commitment to excellence are commendable. I would highly recommend them to anyone looking for top-notch service.",
  },
  {
    user: "Ronee Brown",
    company: "Fusion Dynamics",
    image: user4,
    text: "Working with the team at XYZ Company was a game-changer for our project. Their attention to detail and innovative solutions helped us achieve our goals faster than we thought possible. We are grateful for their expertise and professionalism!",
  },
  {
    user: "Michael Wilson",
    company: "Visionary Creations",
    image: user5,
    text: "I am amazed by the level of professionalism and dedication shown by the team. They were able to exceed our expectations and deliver outstanding results.",
  },
  {
    user: "Emily Davis",
    company: "Synergy Systems",
    image: user6,
    text: "The team went above and beyond to ensure our project was a success. Their expertise and dedication are unmatched. I look forward to working with them again in the future.",
  },
];

export const features = [
  {
    icon: <BookOpenIcon/>,
    text: "Expert-Led Courses",
    description:
"Learn from industry experts and experienced professionals who bring real-world insights to your learning experience."  },
  {
    icon: <Clock />,
    text: "Flexible Learning",
    description:
"Access courses anytime, anywhere. Our platform supports self-paced learning, allowing you to fit education into your busy schedule."  },
  {
    icon: <PlayCircle />,
    text: "Interactive Conten",
    description:
"Engage with a variety of learning materials, including videos, quizzes, and interactive simulations, to enhance your understanding and retention."  },
  {
    icon: <BadgeCheck />,
    text: "Certifications",
    description:
"Earn recognized certificates upon course completion to showcase your new skills and advance your career."  },
  {
    icon: <Users />,
    text: "Collaboration Tools",
    description:
"Join a vibrant community of learners and professionals. Connect with peers, participate in forums, and receive support from our dedicated team."  },
  {
    icon: <ChartBar />,
    text: "Progress Tracking",
    description:
      "Monitor your learning journey with detailed progress reports and personalized feedback to stay on track and achieve your goals.",
  },
];

export const checklistItems = [
  {
    title: "Leadership & Management",
    description:
      "Develop the skills needed to lead and manage teams effectively.",
  },
  {
    title: "Technical Skills",
    description:
      "Master the latest tools and technologies in your field.",
  },
  {
    title: "Communication Skills",
    description:
      "Enhance your ability to communicate clearly and persuasively.",
  },
  {
    title: "Project Management",
    description:
      "earn to plan, execute, and deliver projects successfully.",
  },
];

export const pricingOptions = [
  {
    title: "Free",
    price: "$0",
    features: [
      "Private board sharing",
      "5 Gb Storage",
      "Web Analytics",
      "Private Mode",
    ],
  },
  {
    title: "Pro",
    price: "$10",
    features: [
      "Private board sharing",
      "10 Gb Storage",
      "Web Analytics (Advance)",
      "Private Mode",
    ],
  },
  {
    title: "Enterprise",
    price: "$200",
    features: [
      "Private board sharing",
      "Unlimited Storage",
      "High Performance Network",
      "Private Mode",
    ],
  },
];

export const resourcesLinks = [
  { href: "#", text: "About Us" },
  { href: "#", text: "Contact" },
  { href: "#", text: "FAQs" },
  { href: "#", text: "Privacy Policy" },
  { href: "#", text: "Community Forums" },
];

export const platformLinks = [
  { href: "#", text: "Features" },
  { href: "#", text: "Supported Devices" },
  { href: "#", text: "System Requirements" },
  { href: "#", text: "Downloads" },
  { href: "#", text: "Release Notes" },
];

export const communityLinks = [
  { href: "#", text: "Events" },
  { href: "#", text: "Meetups" },
  { href: "#", text: "Conferences" },
  { href: "#", text: "Hackathons" },
  { href: "#", text: "Jobs" },
];