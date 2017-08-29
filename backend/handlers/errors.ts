export const USER_EXISTS = email => ({ message: `User with email '${email}' already exists` });
export const MUST_BE_ADMIN = () => ({ message: 'Must be an admin to perform action' });
export const USER_NOT_FOUND = () => ({ message: 'User not found' });
export const TEMPLATE_NOT_FOUND = () => ({ message: 'Template not found' });
export const USER_HAS_NO_TEMPLATE = username => ({ message: `User '${username}' has not had a template selected` });
export const USER_HAS_NO_MENTOR = username => ({ message: `User '${username}' has not had a mentor selected` });
export const EVALUATION_NOT_FOUND = () => ({ message: 'Evaluation not found' });
export const SKILL_NOT_FOUND = () => ({ message: 'Skill not found' });
export const MUST_BE_SUBJECT_OF_EVALUATION_OR_MENTOR = () => ({ message: 'Only the person being evaluated and their mentor can view an evaluation' });
export const MUST_BE_LOGGED_IN = () => ({ message: 'You must be logged in to view this page' });
export const MUST_BE_LOGGED_IN_FOR_REQUEST = () => ({ message: 'You must be logged in for this request to be fulfilled' });
export const SUBJECT_CAN_ONLY_UPDATE_NEW_EVALUATION = () => ({ message: 'You can\'t make any changes to this evaluation.' });
export const MENTOR_REVIEW_COMPLETE = () => ({ message: 'This evaluation has been reviewed and is now complete.' });
export const MENTOR_CAN_ONLY_UPDATE_AFTER_SELF_EVALUATION = () => ({ message: 'You can\'t update this evaluation until your mentee has completed their self-evaluation.' });
export const ONLY_USER_AND_MENTOR_CAN_SEE_ACTIONS = () => ({ message: 'You can\'t see actions for another user unless you are their mentor.' });
export const USER_NOT_ADMIN = () => ({ message: 'You must be an admin user to make this request' });
export const INVALID_LEVEL_OR_CATEGORY = (level, category, templateId) => ({ message: `Level '${level}' or Category '${category}' not found in tempate '${templateId}'`});