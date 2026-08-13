import React, { createContext, useContext, useState } from 'react';

const SkillContext = createContext();

const INITIAL_SKILLS = [
  { id: 's1', name: 'JavaScript', levelString: 'Menengah', levelValue: 75, required: 85, type: 'Bahasa Pemrograman' },
  { id: 's2', name: 'Python', levelString: 'Menengah', levelValue: 60, required: 75, type: 'Bahasa Pemrograman' },
  { id: 's3', name: 'React.js', levelString: 'Menengah', levelValue: 70, required: 80, type: 'Framework' },
  { id: 's4', name: 'Node.js', levelString: 'Dasar', levelValue: 55, required: 85, type: 'Backend' },
  { id: 's5', name: 'SQL', levelString: 'Mahir', levelValue: 80, required: 80, type: 'Database' },
  { id: 's6', name: 'Git/CI-CD', levelString: 'Menengah', levelValue: 65, required: 75, type: 'DevOps' },
];

export function SkillProvider({ children }) {
  const [mySkills, setMySkills] = useState(INITIAL_SKILLS);

  const addSkill = (skillName, levelString = 'Dasar', type = 'Lainnya') => {
    if (mySkills.find(s => s.name.toLowerCase() === skillName.toLowerCase())) return false;
    
    let levelValue = 30; // Dasar
    if (levelString.includes('Menengah')) levelValue = 60;
    if (levelString.includes('Mahir')) levelValue = 90;
    
    // Simulate required industry level
    const required = 75 + Math.floor(Math.random() * 15);

    setMySkills([...mySkills, {
      id: `s${Date.now()}`,
      name: skillName,
      levelString,
      levelValue,
      required,
      type
    }]);
    return true;
  };

  const removeSkill = (id) => {
    setMySkills(mySkills.filter(s => s.id !== id));
  };

  return (
    <SkillContext.Provider value={{ mySkills, addSkill, removeSkill }}>
      {children}
    </SkillContext.Provider>
  );
}

export function useSkills() {
  return useContext(SkillContext);
}
