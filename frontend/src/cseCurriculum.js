export const academicSemesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

export const cseCurriculum = {
  '1-1': [
    'Mathematics I',
    'Applied Physics',
    'Programming for Problem Solving (C)',
    'Basic Electrical Engineering',
    'Engineering Graphics',
  ],
  '1-2': [
    'Mathematics II',
    'Applied Chemistry',
    'Python Programming',
    'Basic Electronics',
    'Engineering Mechanics',
  ],
  '2-1': [
    'Discrete Mathematics',
    'Data Structures',
    'Digital Logic Design',
    'Object-Oriented Programming',
    'Computer Organization and Architecture',
  ],
  '2-2': [
    'Design and Analysis of Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Formal Languages and Automata Theory',
    'Probability and Statistics',
  ],
  '3-1': [
    'Computer Networks',
    'Software Engineering',
    'Compiler Design',
    'Web Technologies',
    'Artificial Intelligence',
  ],
  '3-2': [
    'Machine Learning',
    'Distributed Systems',
    'Cloud Computing',
    'Information Security',
    'Software Testing',
  ],
  '4-1': [
    'Big Data Analytics',
    'Internet of Things',
    'Mobile Application Development',
    'Professional Elective I',
    'Open Elective I',
  ],
  '4-2': [
    'Project Work',
    'Internship',
    'Professional Ethics',
    'Entrepreneurship',
    'Professional Elective II',
  ],
};

const normalized = value => value.trim().toLowerCase();

export function semesterForSubject(subject) {
  if (academicSemesters.includes(subject.academicSemester)) return subject.academicSemester;
  const name = normalized(subject.name);
  return academicSemesters.find(semester => cseCurriculum[semester].some(course => normalized(course) === name))
    || ({
      'programming in c': '1-1',
    })[name]
    || null;
}
