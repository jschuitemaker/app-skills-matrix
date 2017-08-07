import * as React from 'react';
import { Table } from 'react-bootstrap';

import Skill from './Skill';

type SkillGroupProps = {
  skillGroup: any, // TODO get types
  skills: any, // TODO get types
  viewSkillDetails: (e: any) => void,
};

const SkillGroup = ({ skillGroup, skills, viewSkillDetails }: SkillGroupProps) => (
  <td>
    <Table bordered>
      <tbody>
      {
        skillGroup.skills.map(
          (skillId) => {
            const skill = skills[skillId];

            return (
              <Skill
                key={skillId}
                skill={skill}
                viewSkillDetails={viewSkillDetails}
              />
            );
          })
      }
      </tbody>
    </Table>
  </td>
);

export default SkillGroup;

