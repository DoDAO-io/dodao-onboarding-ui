import { useClient } from '@/composables/useClient';
import { useWeb3 } from '@/composables/useWeb3';
import {
  GuideQuery_guide,
  GuideQuery_guide_steps
} from '@/graphql/generated/graphqlDocs';
import { getGuide } from '@/helpers/snapshot';
import { GuideSubmissionInput } from '@dodao/onboarding-schemas/inputs/GuideSubmissionInput';
import { InputType } from '@dodao/onboarding-schemas/models/GuideModel';
import {
  GuideStepItemSubmission,
  GuideStepSubmission,
  StepItemSubmissionType
} from '@dodao/onboarding-schemas/models/GuideSubmissionModel';
import { SpaceModel } from '@dodao/onboarding-schemas/models/SpaceModel';
import { v4 as uuidv4 } from 'uuid';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type UserGuideQuestionSubmission = Record<string, string[] | string>;

export function useViewGuide(uuid: string, notify: any, space: SpaceModel) {
  const { send } = useClient();
  const { web3 } = useWeb3();
  const { t } = useI18n();

  const guideRef = ref<GuideQuery_guide>();
  const guideStepsMap = ref<{ [uuid: string]: GuideQuery_guide_steps }>({});
  const guideSubmissionRef = ref<Record<string, UserGuideQuestionSubmission>>(
    {}
  );
  const guideLoaded = ref<boolean>(false);
  const guideSubmittingRef = ref<boolean>(false);
  const activeStepId = ref();

  async function initialize() {
    const guide = await getGuide(uuid);
    guideRef.value = {
      ...guide,
      __typename: 'Guide',
      steps: [
        ...guide.steps,
        {
          __typename: 'GuideStep',
          content: 'The guide has been completed successfully!',
          name: 'Completed',
          order: guide.steps.length,
          uuid: 'UUID',
          stepItems: [],
          id: 'some_id',
          created: new Date().getTime()
        }
      ]
    };

    const minOrder = Math.min(...guide.steps.map(step => step.order));
    activeStepId.value = guide.steps.find(
      step => step.order === minOrder
    )?.uuid;

    guideStepsMap.value = Object.fromEntries<GuideQuery_guide_steps>(
      guide.steps.map(step => [step.uuid, step])
    );

    guideLoaded.value = true;
  }

  function setActiveStep(uuid) {
    activeStepId.value = uuid;
  }

  function goToNextStep(currentStep: GuideQuery_guide_steps) {
    const steps = guideRef.value?.steps || [];
    const nextStep = steps.find(step => step?.order === currentStep.order + 1);
    activeStepId.value = nextStep?.uuid;
  }

  function goToPreviousStep(currentStep: GuideQuery_guide_steps) {
    const steps = guideRef.value?.steps || [];
    const nextStep = steps?.find(step => step?.order === currentStep.order - 1);
    if (nextStep && nextStep?.uuid) {
      activeStepId.value = nextStep?.uuid;
    } else {
      activeStepId.value = steps[steps.length - 1]?.uuid;
    }
  }

  function selectAnswer(
    stepUuid: string,
    questionUuid: string,
    selectedAnswers: string[]
  ) {
    guideSubmissionRef.value = {
      ...guideSubmissionRef.value,
      [stepUuid]: {
        ...guideSubmissionRef.value[stepUuid],
        [questionUuid]: selectedAnswers
      }
    };
  }

  function setUserInput(
    stepUuid: string,
    userInputUuid: string,
    userInput: string
  ) {
    guideSubmissionRef.value = {
      ...guideSubmissionRef.value,
      [stepUuid]: {
        ...guideSubmissionRef.value[stepUuid],
        [userInputUuid]: userInput
      }
    };
  }

  async function submitGuide() {
    guideSubmittingRef.value = true;

    const response: Omit<GuideSubmissionInput, 'timestamp'> = {
      space: space.id,
      uuid: uuidv4(),
      guideUuid: uuid,
      from: web3.value.account,
      steps: Object.keys(guideSubmissionRef.value).map(
        (stepUuid): GuideStepSubmission => {
          const stepResponse = guideSubmissionRef.value[stepUuid];

          return {
            uuid: stepUuid,
            itemResponses: Object.keys(stepResponse).map(
              (itemUuid): GuideStepItemSubmission => {
                const stepItem = guideStepsMap.value[stepUuid].stepItems.find(
                  item => item.uuid === itemUuid
                )!;
                if (
                  stepItem.type === InputType.PrivateShortInput ||
                  stepItem.type === InputType.PublicShortInput
                ) {
                  return {
                    uuid: itemUuid,
                    userInput: stepResponse[itemUuid] as string,
                    type: StepItemSubmissionType.Question
                  };
                } else {
                  return {
                    uuid: itemUuid,
                    selectedAnswerKeys: stepResponse[itemUuid] as string[],
                    type: StepItemSubmissionType.Question
                  };
                }
              }
            )
          };
        }
      )
    };
    const submissionResponse = await send(space, 'guideResponse', response);
    if (submissionResponse?.id) {
      notify(['green', t('notify.guideResponseSubmitted')]);
    }

    const result = submissionResponse?.result.result;
    if (result) {
      console.log('result', result);
      const lastStepContent = `
      The guide has been completed successfully!
      
      You got ${result.correctQuestions.length} correct out of ${result.allQuestions.length} questions
      `;

      guideRef.value = {
        ...guideRef.value!,
        steps: [
          ...guideRef.value?.steps?.slice(0, -1)!,
          {
            __typename: 'GuideStep',
            content: lastStepContent,
            name: 'Completed',
            order: guideRef.value!.steps.length - 1,
            uuid: 'UUID',
            stepItems: [],
            id: 'some_id',
            created: new Date().getTime()
          }
        ]
      };
    }

    guideSubmittingRef.value = false;
  }

  return {
    activeStepId,
    goToNextStep,
    goToPreviousStep,
    guideLoaded,
    guideRef,
    guideResponseRef: guideSubmissionRef,
    guideSubmittingRef,
    initialize,
    selectAnswer,
    setActiveStep,
    submitGuide,
    setUserInput
  };
}
