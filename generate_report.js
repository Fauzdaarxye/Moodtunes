const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, VerticalAlign,
  Header, Footer
} = require('docx');
const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const heading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 180 },
  children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F4E79" })],
});

const heading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "2E75B6" })],
});

const para = (text, opts = {}) => new Paragraph({
  spacing: { after: 160 },
  children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
});

const paraAlign = (text, align) => new Paragraph({
  alignment: align,
  spacing: { after: 160 },
  children: [new TextRun({ text, size: 22, font: "Arial" })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: "Arial" })],
});

const numbered = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: "Arial" })],
});

const divider = () => new Paragraph({
  spacing: { after: 240 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 } },
  children: [],
});

const spacer = () => new Paragraph({ spacing: { after: 200 }, children: [] });

// ── Two-column table row ──────────────────────────────────────────────────────
const twoColRow = (label, value, shade) => new TableRow({
  children: [
    new TableCell({
      borders, width: { size: 3120, type: WidthType.DXA },
      shading: { fill: shade || "EBF3FB", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial" })] })],
    }),
    new TableCell({
      borders, width: { size: 6240, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: "Arial" })] })],
    }),
  ]
});

const tableHeader = (cols, widths) => new TableRow({
  tableHeader: true,
  children: cols.map((c, i) => new TableCell({
    borders,
    width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: "1F4E79", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: c, bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
  }))
});

const tableRow = (cells, widths) => new TableRow({
  children: cells.map((c, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: c, size: 20, font: "Arial" })] })],
  }))
});

// ── Cover Page ───────────────────────────────────────────────────────────────
const coverPage = [
  spacer(), spacer(), spacer(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "AIML MINI PROJECT REPORT", size: 20, font: "Arial", color: "7F7F7F", allCaps: true, characterSpacing: 200 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: "Mood-Based Music Recommendation System", size: 48, bold: true, font: "Arial", color: "1F4E79" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2E75B6", space: 1 } },
    children: [new TextRun({ text: "Using Machine Learning & React Web Application", size: 28, font: "Arial", color: "2E75B6", italics: true })],
  }),
  spacer(), spacer(),
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 6240],
    rows: [
      twoColRow("Course",     "Artificial Intelligence & Machine Learning"),
      twoColRow("Project Type","Mini Project"),
      twoColRow("Tech Stack", "React, Flask, scikit-learn, Python"),
      twoColRow("Dataset",    "Spotify-style audio features dataset (1000 tracks)"),
      twoColRow("Model",      "Logistic Regression + Random Forest"),
      twoColRow("Accuracy",   "99.5% on test set"),
      twoColRow("Year",       new Date().getFullYear().toString()),
    ],
  }),
  spacer(), spacer(), spacer(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Submitted in partial fulfilment of the requirements for the AIML Mini Project", size: 20, font: "Arial", color: "7F7F7F", italics: true })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 4 } },
          spacing: { after: 160 },
          children: [new TextRun({ text: "Mood-Based Music Recommendation System  |  AIML Mini Project", size: 18, font: "Arial", color: "7F7F7F" })],
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
          children: [
            new TextRun({ text: "Page ", size: 18, font: "Arial", color: "7F7F7F" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "7F7F7F" }),
            new TextRun({ text: " of ", size: 18, font: "Arial", color: "7F7F7F" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial", color: "7F7F7F" }),
          ],
        })]
      })
    },
    children: [
      // ── Cover ───────────────────────────────────────────────────────────────
      ...coverPage,

      // ── 1. Abstract ─────────────────────────────────────────────────────────
      heading1("1. Abstract"),
      para("This project presents a full-stack web application for mood-based music recommendation using supervised machine learning. The system enables users to select their current emotional state from four predefined mood categories — Happy, Sad, Energetic, and Calm — and receive personalised song recommendations driven by a machine learning classifier trained on audio features extracted from a Spotify-style dataset."),
      para("The classification model leverages six audio features: valence, energy, danceability, tempo, acousticness, and loudness. Two models were evaluated — Logistic Regression and Random Forest — achieving test accuracies of 99.5% and 99.0% respectively. The Logistic Regression model was selected as the production model due to its marginally higher accuracy and faster inference."),
      para("The web application is built using React.js on the frontend (with a Spotify-inspired dark UI) and Flask on the backend, exposing REST API endpoints for recommendations, search, analytics, and on-demand model retraining. The system is fully deployable to Vercel (frontend) and Render (backend)."),
      divider(),

      // ── 2. Introduction ─────────────────────────────────────────────────────
      heading1("2. Introduction"),
      para("Music has long been recognised as a powerful emotional regulator. People instinctively choose different music depending on their mood — upbeat pop when happy, mellow acoustics when sad, high-energy electronic when exercising. Yet discovering music that precisely matches an emotional state remains a manual, time-consuming process. Existing platforms like Spotify offer playlist suggestions but rarely surface the algorithmic reasoning behind recommendations."),
      para("This project bridges the gap between emotional intelligence and music discovery by building a machine learning pipeline that classifies songs into mood categories based on quantifiable audio features, and serves those recommendations through a modern web interface. The system is transparent, interactive, and analytics-driven — users can explore feature distributions, model accuracy, and confusion matrices directly in the browser."),
      heading2("2.1 Motivation"),
      para("The rise of audio feature APIs (Spotify, Last.fm) has made it possible to characterise songs numerically. Features like valence (musical positivity), energy, and danceability are reliable proxies for emotional tone. By training a classifier on these features, we can recommend music that aligns with a user's stated mood with high accuracy."),
      heading2("2.2 Scope"),
      para("This project covers dataset creation, mood labelling, feature engineering, model training and evaluation, REST API development, and a complete React frontend with analytics visualisation. Deployment configurations for cloud platforms are also included."),
      divider(),

      // ── 3. Problem Statement ────────────────────────────────────────────────
      heading1("3. Problem Statement"),
      para("Users struggle to discover music that matches their current emotional state. Manual browsing is inefficient; existing recommendation engines are opaque. The problem can be stated as follows:"),
      spacer(),
      new Paragraph({
        spacing: { after: 200 },
        indent: { left: 720, right: 720 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: "2E75B6", space: 12 }
        },
        children: [
          new TextRun({ text: "Given a user's stated mood and a dataset of songs characterised by audio features, train a classification model that maps audio feature vectors to mood labels, and build a web application that surfaces song recommendations for that mood in real time.", size: 22, font: "Arial", italics: true }),
        ],
      }),
      spacer(),
      heading2("3.1 Objectives"),
      bullet("Collect or generate a representative Spotify-style audio features dataset with mood labels."),
      bullet("Train and evaluate machine learning classifiers (Logistic Regression, Random Forest) on the dataset."),
      bullet("Expose the trained model as a REST API (Flask)."),
      bullet("Build a React frontend with mood selection, song cards, search, and analytics dashboard."),
      bullet("Deploy the full stack to cloud platforms with no broken routes."),
      divider(),

      // ── 4. Methodology ──────────────────────────────────────────────────────
      heading1("4. Methodology"),
      para("The project follows the CRISP-DM (Cross-Industry Standard Process for Data Mining) methodology, adapted for web application development:"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1560, 2400, 5400],
        rows: [
          tableHeader(["Phase", "Stage", "Activities"], [1560, 2400, 5400]),
          tableRow(["1", "Data Understanding", "Define audio features, explore Spotify API structure, identify mood proxies"], [1560, 2400, 5400]),
          tableRow(["2", "Data Preparation", "Generate synthetic dataset, create mood labels via rule-based heuristics, scale features"], [1560, 2400, 5400]),
          tableRow(["3", "Modelling", "Train Logistic Regression and Random Forest classifiers, cross-validate"], [1560, 2400, 5400]),
          tableRow(["4", "Evaluation", "Accuracy, confusion matrix, classification report, feature importance"], [1560, 2400, 5400]),
          tableRow(["5", "Deployment", "Flask REST API, React frontend, Render + Vercel cloud deployment"], [1560, 2400, 5400]),
        ],
      }),
      spacer(),
      heading2("4.1 Mood Labelling Rules"),
      para("Since publicly available datasets rarely include mood labels, moods are derived from audio feature rules:"),
      bullet("Happy: valence > 0.6 AND energy > 0.6 — high positivity and activity"),
      bullet("Sad: valence < 0.4 AND energy < 0.4 — low positivity and low energy"),
      bullet("Energetic: energy > 0.75 AND tempo > 120 BPM — high intensity"),
      bullet("Calm: residual — low energy, high acousticness, slow tempo"),
      heading2("4.2 Feature Engineering"),
      para("All six features are numeric and continuous, requiring StandardScaler normalisation before fitting Logistic Regression. Tree-based models (Random Forest) are scale-invariant but were also scaled for consistency. No categorical encoding was required."),
      divider(),

      // ── 5. Dataset ──────────────────────────────────────────────────────────
      heading1("5. Dataset Description"),
      heading2("5.1 Overview"),
      para("The dataset was synthetically generated to mirror the statistical properties of real Spotify audio feature distributions. It contains 1,000 tracks, 250 per mood class, with the following columns:"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 1560, 5460],
        rows: [
          tableHeader(["Feature", "Range", "Description"], [2340, 1560, 5460]),
          tableRow(["valence",      "0 – 1",    "Musical positivity. High = cheerful; Low = sad/angry"], [2340, 1560, 5460]),
          tableRow(["energy",       "0 – 1",    "Perceptual intensity and activity. High = fast, loud, noisy"], [2340, 1560, 5460]),
          tableRow(["danceability", "0 – 1",    "Suitability for dancing based on tempo, rhythm, beat strength"], [2340, 1560, 5460]),
          tableRow(["tempo",        "40 – 200", "Estimated tempo in beats per minute (BPM)"], [2340, 1560, 5460]),
          tableRow(["acousticness", "0 – 1",    "Confidence measure of whether track is acoustic"], [2340, 1560, 5460]),
          tableRow(["loudness",     "-30 – 0",  "Overall loudness in decibels (dB)"], [2340, 1560, 5460]),
          tableRow(["mood",         "Categorical", "Target label: Happy / Sad / Energetic / Calm"], [2340, 1560, 5460]),
        ],
      }),
      spacer(),
      heading2("5.2 Dataset Statistics"),
      bullet("Total samples: 1,000 (balanced — 250 per class)"),
      bullet("Train/test split: 80% / 20% (stratified)"),
      bullet("No missing values after median imputation"),
      bullet("Features normalised with StandardScaler (mean=0, std=1)"),
      divider(),

      // ── 6. Model ────────────────────────────────────────────────────────────
      heading1("6. Model Description"),
      heading2("6.1 Logistic Regression (Best Model)"),
      para("Logistic Regression is a linear classification algorithm that models the probability of each class using the softmax function for multi-class problems. It is well-suited for linearly separable feature spaces and produces probabilistic outputs."),
      heading2("6.2 Random Forest"),
      para("Random Forest is an ensemble of decision trees trained with bootstrap aggregation (bagging). Each tree votes on the predicted class and the majority vote is taken. It handles non-linear decision boundaries and provides feature importances."),
      heading2("6.3 Hyperparameters"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 3120, 3120],
        rows: [
          tableHeader(["Parameter", "Logistic Regression", "Random Forest"], [3120, 3120, 3120]),
          tableRow(["Solver / n_estimators", "lbfgs (default)", "200 trees"], [3120, 3120, 3120]),
          tableRow(["max_iter",              "1000",            "N/A"], [3120, 3120, 3120]),
          tableRow(["random_state",          "42",              "42"], [3120, 3120, 3120]),
          tableRow(["multi_class",           "auto (softmax)", "N/A"], [3120, 3120, 3120]),
        ],
      }),
      spacer(),
      divider(),

      // ── 7. Results ──────────────────────────────────────────────────────────
      heading1("7. Results & Evaluation"),
      heading2("7.1 Model Accuracy"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          tableHeader(["Model", "Test Accuracy"], [4680, 4680]),
          tableRow(["Logistic Regression", "99.5%"], [4680, 4680]),
          tableRow(["Random Forest",       "99.0%"], [4680, 4680]),
        ],
      }),
      spacer(),
      heading2("7.2 Classification Report (Logistic Regression)"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 1755, 1755, 1755, 1755],
        rows: [
          tableHeader(["Class", "Precision", "Recall", "F1-Score", "Support"], [2340, 1755, 1755, 1755, 1755]),
          tableRow(["Calm",      "1.00", "1.00", "1.00", "50"], [2340, 1755, 1755, 1755, 1755]),
          tableRow(["Energetic", "1.00", "0.98", "0.99", "50"], [2340, 1755, 1755, 1755, 1755]),
          tableRow(["Happy",     "0.98", "1.00", "0.99", "50"], [2340, 1755, 1755, 1755, 1755]),
          tableRow(["Sad",       "1.00", "1.00", "1.00", "50"], [2340, 1755, 1755, 1755, 1755]),
          tableRow(["Accuracy",  "",     "",     "0.99",  "200"], [2340, 1755, 1755, 1755, 1755]),
        ],
      }),
      spacer(),
      heading2("7.3 Confusion Matrix"),
      para("The confusion matrix shows that only 1 sample was misclassified: one Energetic track was predicted as Happy, which is understandable given the overlap in high-energy, high-valence feature space between these two moods."),
      heading2("7.4 Feature Analysis"),
      para("The most discriminative features were valence and energy (primary mood separators), followed by tempo and acousticness. Loudness and danceability provided supplementary signal for Energetic vs Calm discrimination."),
      divider(),

      // ── 8. Web Application ──────────────────────────────────────────────────
      heading1("8. Web Application Architecture"),
      heading2("8.1 Frontend (React.js)"),
      bullet("Home Page: hero section with animated particle canvas, mood preview cards, and feature highlights"),
      bullet("Mood Selection Page: 4 interactive mood cards with audio feature descriptions and song count slider"),
      bullet("Results Page: responsive grid of song cards with feature bars, search/filter, and playlist stats"),
      bullet("Analytics Dashboard: mood distribution bars, model accuracy comparison, feature radar (SVG), confusion matrix heatmap"),
      heading2("8.2 Backend (Flask REST API)"),
      bullet("GET /recommend?mood=Happy&limit=10 — returns matching songs from dataset"),
      bullet("POST /recommend with {features: {...}} — predicts mood from audio features then recommends"),
      bullet("GET /analytics — returns all chart data, confusion matrix, feature importances"),
      bullet("GET /search?q=adele&mood=Sad — full-text search across track name and artist"),
      bullet("POST /train — retrains the model on demand"),
      heading2("8.3 Machine Learning Pipeline"),
      numbered("Dataset is loaded from CSV at startup"),
      numbered("StandardScaler normalises feature vectors"),
      numbered("Trained model predicts mood label from feature vector"),
      numbered("Matching songs are retrieved from the dataset by mood label"),
      numbered("JSON response is returned to frontend"),
      divider(),

      // ── 9. Deployment ───────────────────────────────────────────────────────
      heading1("9. Deployment"),
      heading2("9.1 Backend (Render)"),
      bullet("Platform: render.com (free tier web service)"),
      bullet("Build command: pip install -r requirements.txt && python ../model/train_model.py"),
      bullet("Start command: gunicorn app:app --bind 0.0.0.0:$PORT"),
      bullet("Model artefacts are regenerated at every deploy"),
      heading2("9.2 Frontend (Vercel)"),
      bullet("Platform: vercel.com (free tier)"),
      bullet("Root directory: frontend/"),
      bullet("Build command: npm run build"),
      bullet("Environment variable: VITE_API_URL = https://<render-service>.onrender.com"),
      divider(),

      // ── 10. Conclusion ──────────────────────────────────────────────────────
      heading1("10. Conclusion"),
      para("This project successfully demonstrates the application of supervised machine learning to music recommendation. A Logistic Regression classifier trained on six Spotify audio features achieved 99.5% accuracy in classifying songs into four mood categories — Happy, Sad, Energetic, and Calm."),
      para("The accompanying web application provides an intuitive user experience: mood selection is streamlined, recommendations are surfaced as visually appealing song cards, and the analytics dashboard gives insight into model internals. The system is fully deployable to cloud platforms with minimal configuration."),
      para("The project shows that audio features are highly predictive of mood, and that simple linear classifiers are competitive with ensemble methods when features are well-engineered."),
      divider(),

      // ── 11. Future Scope ────────────────────────────────────────────────────
      heading1("11. Future Scope"),
      bullet("Spotify API Integration: Replace synthetic dataset with real-time data via the Spotify Web API, fetching audio features for any song."),
      bullet("Deep Learning: Implement a neural network (LSTM or 1D-CNN) on raw audio spectrograms for higher fidelity mood classification."),
      bullet("User Profiles: Allow users to rate songs, building a personal preference model using collaborative filtering."),
      bullet("Playlist Generation: Auto-generate Spotify-compatible playlists exportable to a user's account."),
      bullet("Multimodal Input: Accept voice/text mood input and infer mood using NLP (e.g., sentiment analysis)."),
      bullet("Real-Time Audio Analysis: Accept uploaded audio files, extract features client-side using the Web Audio API, and classify mood on the fly."),
      divider(),

      // ── 12. References ──────────────────────────────────────────────────────
      heading1("12. References"),
      numbered("Spotify Web API Audio Features Documentation — developer.spotify.com/documentation/web-api"),
      numbered("Pedregosa et al. (2011). scikit-learn: Machine Learning in Python. JMLR 12, pp. 2825-2830."),
      numbered("Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32."),
      numbered("Kaggle Spotify Tracks Dataset — kaggle.com/datasets/maharshipandya/spotify-tracks-dataset"),
      numbered("Flask Documentation — flask.palletsprojects.com"),
      numbered("React Documentation — react.dev"),
      numbered("Vite Documentation — vitejs.dev"),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('MoodMusic_Project_Report.docx', buf);
  console.log('Report saved: MoodMusic_Project_Report.docx');
});
