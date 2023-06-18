function setWorkExperienceTime() {
  const FIRST_WORK_START_DATE = "2020-02";

  const workExperienceTimeElement = document.querySelector(
    "#work-experience-time"
  );
  const today = new Date();
  const workExperience =
    new Date(`${today.getFullYear()}-${today.getMonth()}`) -
    new Date(FIRST_WORK_START_DATE);

  const workExperienceTime = workExperience / 1000 / 60 / 60 / 24 / 365;

  workExperienceTimeElement.textContent = `${workExperienceTime.toFixed(
    1
  )} years`;
}

setWorkExperienceTime();
