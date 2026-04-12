import { BookOpen, ClipboardCheck, CalendarDays, MapPin, Bus, MessageCircle } from "lucide-react";
import React from "react";

export interface TutorialStep {
  message: string;
  targetId?: string;
  openCollapsible?: string;
  actionLabel?: string;
  /** Navigate to this route BEFORE showing this step (step renders on destination page) */
  navigateTo?: string;
  openChat?: boolean;
  /** If true, this is a completion step — shows "Finished with Tutorial" */
  isFinished?: boolean;
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
      {
        message: "🎉 Finished with Tutorial! You now know how to upload syllabi and explore your courses. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
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
      {
        message: "🎉 Finished with Tutorial! You're all set to track your exams. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
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
        message: "To add assignments, head to your Personal Calendar and create events with the 'assignment' type. They'll automatically appear here! Ready to open the calendar?",
        targetId: "upcoming-assignments",
        actionLabel: "Open Calendar",
      },
      {
        message: "Welcome to your Personal Calendar! 📆 From here you can create new events and assignments using the form. Try adding an event or click 'Maybe Later' to continue.",
        navigateTo: "/calendar",
        actionLabel: "Add an Event",
      },
      {
        message: "🎉 Finished with Tutorial! Your assignments will now appear in the Upcoming Assignments widget. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
      },
    ],
  },
  {
    id: "campus-resources",
    title: "Explore Campus Resources",
    icon: <MapPin className="w-4 h-4" />,
    steps: [
      {
        message: "Step 1: Let me show you some handy campus tools! 🗺️ Scroll down to find Campus Map, Safety & Resources, and Dining information.",
        targetId: "campus-resources-grid",
      },
      {
        message: "Step 2: Let's open the Campus Map to see campus buildings and navigation!",
        targetId: "campus-map-card",
        actionLabel: "Open Map",
      },
      {
        message: "Step 3: Here's the Campus Map! You can explore buildings and navigate around campus. Let's head back and check out Safety & Resources next.",
        navigateTo: "/campus-map",
        actionLabel: "Next",
      },
      {
        message: "Step 4: The Safety & Resources section has emergency contacts, Title IX info, and support services. Let's take a look!",
        navigateTo: "/",
        targetId: "safety-card",
        actionLabel: "Open Safety",
      },
      {
        message: "Step 5: Here are your Safety & Resources! Emergency contacts, Title IX information, and support services are all here. Now let's check out Dining!",
        navigateTo: "/safety-resources",
        actionLabel: "Next",
      },
      {
        message: "Step 6: Check out Dining for meal plans, menus, hours, and dining hall locations!",
        navigateTo: "/",
        targetId: "dining-card",
        actionLabel: "View Dining",
      },
      {
        message: "Step 7: Here's the Dining page! Browse dining locations, meal plans, menus, and hours.",
        navigateTo: "/dining",
      },
      {
        message: "🎉 Finished with Tutorial! You now know where to find Campus Map, Safety & Resources, and Dining. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
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
        message: "Ready to see campus shuttle routes? Click below to open Transit!",
        targetId: "transit-card",
        actionLabel: "Open Transit",
      },
      {
        message: "Welcome to Transit! 🚌 Here you can see campus shuttle routes. Try switching between the 'Campus Shuttles' and 'Public Transit' tabs to view metro lines and nearby stations!",
        navigateTo: "/transit",
      },
      {
        message: "🎉 Finished with Tutorial! You now know how to find shuttle routes and public transit info. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
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
      {
        message: "🎉 Finished with Tutorial! Remember, I'm always here to help. You can revisit this anytime from the tutorial menu.",
        isFinished: true,
      },
    ],
  },
];
