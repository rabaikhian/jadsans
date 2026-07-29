export function getDemoStudents() {
  return [
    {
      id: "demo-s1",
      name: "Alex Johnson (Math)",
      category: "งานสอน",
      location: "Room 101, Science Hub",
      color: "hsl(260, 85%, 65%)",
      grade: "Grade 10",
      enrolled_date: "2026-01-10",
      current_course: "Algebra II & Trigonometry",
      next_course: "Pre-Calculus",
      report: "Alex shows great progress in quadratic equations. Need to focus more on trigonometric identities next week.",
    },
    {
      id: "demo-s2",
      name: "Bella Smith (Physics)",
      category: "งานสอน",
      location: "Lab Room 4",
      color: "hsl(142, 70%, 45%)",
      grade: "Grade 11",
      enrolled_date: "2026-02-15",
      current_course: "Classical Mechanics",
      next_course: "Electromagnetism I",
      report: "Bella has excellent intuitive understanding of kinematics. Her lab reports are consistently top tier.",
    },
    {
      id: "demo-s3",
      name: "Charlie Brown (English)",
      category: "งานสอน",
      location: "Zoom Online Classroom",
      color: "hsl(35, 92%, 50%)",
      grade: "Grade 9",
      enrolled_date: "2026-03-01",
      current_course: "Creative Prose & Composition",
      next_course: "Introduction to World Literature",
      report: "Charlie is very creative. We are working on expanding vocabulary and refining grammar structures in essays.",
    },
    {
      id: "demo-s4",
      name: "Danny Phantom (Chemistry)",
      category: "งานสอน",
      location: "Lab Room 2",
      color: "hsl(200, 80%, 45%)",
      grade: "Grade 11",
      enrolled_date: "2026-04-10",
      current_course: "General Chemistry",
      next_course: "Organic Chemistry",
      report: "Danny is suspended for this month because of basketball tournament schedule conflicts.",
      is_hidden: true
    }
  ];
}

export function getDemoBookings() {
  const today = new Date();
  
  const formatDateOffset = (daysOffset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: "demo-b1",
      class_name: "งานสอน",
      student_name: "Alex Johnson (Math)",
      date: formatDateOffset(-2),
      start_time: "09:00",
      end_time: "10:30",
      notes: "Weekly Math tutoring: Focus on Algebra workbook chapter 5.",
      color: "hsl(260, 85%, 65%)",
      location: "Room 101, Science Hub",
      class_type: "Onsite",
      status: "done"
    },
    {
      id: "demo-b2",
      class_name: "งานสอน",
      student_name: "Bella Smith (Physics)",
      date: formatDateOffset(-1),
      start_time: "14:00",
      end_time: "15:30",
      notes: "Physics class: Reviewing homework questions on Newton's Laws.",
      color: "hsl(142, 70%, 45%)",
      location: "Lab Room 4",
      class_type: "Onsite",
      status: "done"
    },
    {
      id: "demo-b3",
      class_name: "งานสอน",
      student_name: "Charlie Brown (English)",
      date: formatDateOffset(0), // Today
      start_time: "10:00",
      end_time: "11:30",
      notes: "English tutoring: Discussing essay outlines.",
      color: "hsl(35, 92%, 50%)",
      location: "Zoom Online Classroom",
      class_type: "Online",
      status: "scheduled"
    },
    {
      id: "demo-b4",
      class_name: "งานประชุม",
      student_name: "Weekly Department Sync",
      date: formatDateOffset(1), // Tomorrow
      start_time: "13:00",
      end_time: "14:30",
      notes: "Review curriculum planning for the upcoming autumn semester.",
      color: "hsl(25, 95%, 50%)",
      location: "Conference Room B",
      class_type: "Onsite",
      status: "scheduled"
    },
    {
      id: "demo-b5",
      class_name: "งานนัดลูกค้า",
      student_name: "Parent consultation: Alex Johnson",
      date: formatDateOffset(2),
      start_time: "16:00",
      end_time: "17:00",
      notes: "Meeting with Alex's mother to discuss mid-term academic growth.",
      color: "hsl(340, 85%, 60%)",
      location: "Office Room 12",
      class_type: "Onsite",
      status: "scheduled"
    },
    {
      id: "demo-b6",
      class_name: "งานสอน",
      student_name: "Alex Johnson (Math)",
      date: formatDateOffset(3),
      start_time: "09:00",
      end_time: "10:30",
      notes: "Math tutoring: Start chapter 6 coordinate geometry.",
      color: "hsl(260, 85%, 65%)",
      location: "Room 101, Science Hub",
      class_type: "Onsite",
      status: "scheduled"
    },
    {
      id: "demo-b7",
      class_name: "งานสอน",
      student_name: "Bella Smith (Physics)",
      date: formatDateOffset(5),
      start_time: "14:00",
      end_time: "15:30",
      notes: "Physics Class: Lab work on kinetic friction coefficients.",
      color: "hsl(142, 70%, 45%)",
      location: "Lab Room 4",
      class_type: "Onsite",
      status: "scheduled"
    },
    {
      id: "demo-b8",
      class_name: "งานวิจัย",
      student_name: "Cognitive Science Review",
      date: formatDateOffset(6),
      start_time: "11:00",
      end_time: "12:30",
      notes: "Self-study session: Read newly published literature on spaced repetition.",
      color: "hsl(190, 90%, 45%)",
      location: "Library Annex",
      class_type: "Onsite",
      status: "scheduled"
    }
  ];
}
