import { getAI } from "../utils/aiSource";

let INSTANCE: any;

async function getInstance() {
  if (!INSTANCE) {
    const ai = getAI();

    INSTANCE = await ai.languageModel.create({
      initialPrompts: [
        {
          role: "system",
          content: `Evaluate the following text for relevance and uniqueness. If the information is new or different from what has been shared before, respond with 'keep it'. If the information has been mentioned before or is not necessary, respond with 'delete it'.`,
        },
        {
          role: "user",
          content:
            "The article explores the link between physical activity and improved cardiovascular health. Numerous studies have shown that regular exercise, such as walking, running, or cycling, contributes significantly to reducing the risk of heart disease. In addition to the well-known benefits of cardiovascular exercise, it's essential to recognize that moderate-intensity physical activities can have a significant impact on overall heart health.\n\n[REVIEW]A variety of studies have confirmed that individuals who engage in at least 30 minutes of moderate physical activity most days of the week experience a reduced risk of heart disease. This type of exercise helps regulate cholesterol levels, lower blood pressure, and improve circulation.[/REVIEW]\n\nFurthermore, regular exercise has been linked to a decrease in the risk of other chronic diseases such as type 2 diabetes and stroke. The article concludes that adopting a physically active lifestyle, regardless of age, can substantially lower the likelihood of developing serious cardiovascular problems and improve long-term health outcomes.",
        },
        {
          role: "assistant",
          content: "delete it",
        },

        {
          role: "user",
          content: `The document discusses the importance of teamwork in modern organizations and how collaboration fosters innovation.
  
    [REVIEW]Studies show that teams working in silos tend to deliver lower-quality outputs and struggle with productivity challenges.[/REVIEW]
    
    In conclusion, fostering a culture of collaboration is essential for achieving organizational goals.`,
        },
        {
          role: "assistant",
          content: "keep it",
        },
        {
          role: "user",
          content:
            "The article examines the role of technology in modern education, highlighting its impact on student engagement.\n\n[REVIEW]The integration of digital tools like tablets and educational apps has been shown to enhance learning outcomes in classrooms.[/REVIEW]\n\nOverall, adopting technology in schools is essential for preparing students for the future.",
        },
        {
          role: "assistant",
          content: "keep it",
        },

        {
          role: "user",
          content:
            "The report focuses on the benefits of mindfulness practices for stress management.\n\n[REVIEW]Engaging in daily mindfulness exercises has been proven to lower cortisol levels and improve emotional regulation.[/REVIEW]\n\nIn conclusion, mindfulness is a powerful tool for enhancing mental resilience.",
        },
        {
          role: "assistant",
          content: "delete it",
        },

        {
          role: "user",
          content: `The report focuses on the benefits of mindfulness practices for stress management.[REVIEW]Engaging in daily mindfulness exercises has been proven to lower cortisol levels and improve emotional regulation.[/REVIEW]
      
      In conclusion, mindfulness is a powerful tool for enhancing mental resilience.`,
        },
        {
          role: "assistant",
          content: "delete it",
        },
      ],
    });
  }

  return INSTANCE;
}

async function getKeeperAi() {
  const instance = await getInstance();
  return instance.clone();
}

export async function shouldKeepIt(
  previousText: string,
  currentText: string,
  nextText: string
): Promise<boolean> {
  const ai = await getKeeperAi();
  const prompt = `${previousText || ""}

  [REVIEW]${currentText}[/REVIEW]

${nextText || ""}`;

  const text = await ai.prompt(prompt).catch((err: Error) => {
    console.error(err);
    return "delete it";
  });

  return text.toLowerCase().includes("keep it");
}
