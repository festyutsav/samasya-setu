const {
  predictCategory,
} = require(
  "./services/aiCategoryService"
);


const runTest = async () => {

  try {

    console.log(
      "Starting SamasyaSetu AI test..."
    );


    const result =
      await predictCategory(

        "Dirty water from village handpump",

        "People in our village are getting yellow and contaminated water from the handpump. Many families are facing problems because there is no clean drinking water."

      );


    console.log(
      "\n================================"
    );

    console.log(
      "AI RESULT"
    );

    console.log(
      "================================\n"
    );


    console.log(
      "Suggested Category:",
      result.category
    );


    console.log(
      "Confidence:",
      result.confidence
    );


    console.log(
      "\nAll Scores:"
    );


    console.table(
      result.scores
    );


  } catch (error) {

    console.error(
      "\nAI TEST ERROR:"
    );

    console.error(
      error
    );

  }

};


runTest();