import { BookOpen, ClipboardCheck, CalendarDays, MapPin, Bus, MessageCircle } from "lucide-react";
import React from "react";

export interface TutorialStep {
  message: string;
  targetId?: string;
  openCollapsible?: string;
  actionLabel?: string;
  navigateTo?: string;
  openChat?: boolean;
}

export interface TutorialDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
}

export const tutorialDefs: TutorialDef[] = [
  {
    id: "syllabus",
    title: "Upload a Syllabus",
    icon: <BookOpen className="w-4 h-4" />,
    steps: [
      {
        message: "Let's start by uploading a syllabus! This helps me personalize your courses. 🎓 I'll take you to the Class Syllabi section now.",
        targetId: "course-hub",
        openCollapsible: "syllabi-section",
      },
      {
        message: "Here's the Class Syllabi section! You can drag-and-drop or click to upload your syllabus file. Want to upload one now?",
        targetId: "syllabi-section",
        actionLabel: "Upload",
      },
      {
        message: "After uploading, you can expand each syllabus to see parsed details like Course Description, Learning Objectives, and Weekly Schedule. Try clicking on a syllabus!",
        targetId: "syllabi-section",
      },
      {
        message: "Now check out the course that was created from your syllabus! Click 'View Course' to explore lessons, quizzes, and study materials.",
        targetId: "course-hub",
        actionLabel: "View Course",
      },
    ],
  },
  {
    id: "test-reminders",
    title: "Add a Test Reminder",
    icon: <ClipboardCheck className="w-4 h-4" />,
    steps: [
      {
        message: "Never miss an exam! 📝 Let me take you to the Test Reminders widget where you can add upcoming tests.",
        targetId: "test-reminders",
      },
      {
        message: "You can add tests manually using the '+' button, or auto-extract test dates from your uploaded syllabi. Want to add a test now?",
        targetId: "test-reminders",
        actionLabel: "Add a Test",
      },
    ],
  },
  {
    id: "assignments",
    title: "Track Assignments",
    icon: <CalendarDays className="w-4 h-4" />,
    steps: [
      {
        message: "Let's set up your assignments! 📅 You can track due dates through the Upcoming Assignments widget.",
        targetId: "upcoming-assignments",
      },
      {
        message: "To add assignments, head to your Personal Calendar and create events with the 'assignment' type. They'll automatically appear here! Want to open the calendar?",
        targetId: "upcoming-assignments",
        actionLabel: "Open Calendar",
        navigateTo: "/calendar",
      },
    ],
  },
  {
    id: "campus-resources",
    title: "Explore Campus Resources",
    icon: <MapPin className="w-4 h-4" />,
    steps: [
      {
        message: "Let me show you some handy campus tools! 🗺️ Scroll down to find Campus Map, Safety & Resources, and Dining information.",
        targetId: "campus-resources-grid",
      },
      {
        message: "Try opening the Campus Map to see campus buildings and navigation!",
        targetId: "campus-map-card",
        actionLabel: "Open Map",
        navigateTo: "/campus-map",
      },
      {
        message: "The Safety & Resources section has emergency contacts, Title IX info, and support services.",
        targetId: "safety-card",
        actionLabel: "Open Safety",
        navigateTo: "/safety-resources",
      },
      {
        message: "Check out Dining for meal plans, menus, hours, and dining hall locations!",
        targetId: "dining-card",
        actionLabel: "Open Dining",
        navigateTo: "/dining",
      },
    ],
  },
  {
    id: "transit",
    title: "Navigate Transit & Shuttles",
    icon: <Bus className="w-4 h-4" />,
    steps: [
      {
        message: "Getting around is easy! 🚌 Let me show you the Transit & Shuttles widget.",
        targetId: "transit-card",
      },
      {
        message: "Open Transit to see campus shuttle routes. Once there, you can switch between 'Campus Shuttles' and 'Public Transit' tabs to view metro lines and nearby stations!",
        targetId: "transit-card",
        actionLabel: "Open Transit",
        navigateTo: "/transit",
      },
    ],
  },
  {
    id: "agentb-chat",
    title: "Chat with AgentB",
    icon: <MessageCircle className="w-4 h-4" />,
    steps: [
      {
        message: "Last but not least — you can always ask me anything! 💬 Whether it's a study question, campus info, or help with assignments, I'm here 24/7.",
        targetId: "agentb-card",
      },
      {
        message: "Try sending me a message! I can help with explanations, study tips, and more.",
        targetId: "agentb-card",
        actionLabel: "Chat with AgentB",
        openChat: true,
      },
    ],
  },
];
