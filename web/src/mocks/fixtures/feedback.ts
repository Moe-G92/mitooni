import type { SpeakingFeedback, WritingFeedback } from "@/api/schemas";

/*
 * Dummy marking for the prototype. Essays and transcripts are original, written to read like
 * Iranian learners at the stated band, with the errors Persian speakers typically make.
 * Every annotation quote is an exact substring of its essay or transcript, and `words` is the
 * real whitespace word count (checked by a script).
 */

/* ------------------------------------------------------------------ */
/*  Writing Task 1 (band 6.0)                                          */
/* ------------------------------------------------------------------ */

const task1Essay = `The bar chart illustrate the average number of hours that young people between 16 and 24 years old spent in five leisure activities per week in one country in 2005, 2015 and 2025.

Overall, the time for social media and video games increased significantly, while watching TV and reading for pleasure has decreased. Sport was almost same during the period.

In 2005, watching the TV was the most popular activity with 14 hours a week, but this figure dropped to 10 hours in 2015 and only 6 hours in 2025. Similarly, reading for pleasure fell down from 4 hours to 2 hours. On the other hand, social media had only 2 hours in 2005, however it rose dramatically to 9 hours in 2015 and reached at 15 hours in 2025, which made it the most popular activity at the end of period.

Video games also grew steadily from 3 to 8 hours. Finally, young people spent about 5 hours for sport and exercise in all three years, with a small peak of 6 hours in 2015.`;

export const writingFeedbackTask1: WritingFeedback = {
  partId: "a1-w-p1",
  task: 1,
  words: 176,
  essay: task1Essay,
  band: 6,
  criteria: [
    {
      key: "tr",
      band: 6.5,
      comment: {
        en: "You give a clear overview and report the key figures for every activity. For video games you skip the 2015 figure, so that comparison is thinner than the others.",
        fa: "یک جمع‌بندی کلی روشن نوشته‌اید و عددهای اصلی هر فعالیت را آورده‌اید. برای بازی‌های ویدیویی عدد سال ۲۰۱۵ را جا انداخته‌اید، برای همین این مقایسه از بقیه ضعیف‌تر است.",
      },
      metrics: [
        {
          key: "overview",
          label: { en: "Overview", fa: "جمع‌بندی کلی" },
          score: 78,
          verdict: "good",
          note: {
            en: "Your second paragraph sums up the main trends before giving any numbers, which is exactly what the examiner looks for.",
            fa: "پاراگراف دوم پیش از آوردن هر عددی روندهای اصلی را خلاصه می‌کند، و این دقیقاً همان چیزی است که ممتحن دنبالش است.",
          },
          example: "Overall, the time for social media and video games increased significantly",
        },
        {
          key: "key-features",
          label: { en: "Key features", fa: "نکته‌های اصلی" },
          score: 62,
          verdict: "acceptable",
          note: {
            en: "You compare the biggest changes well, but for video games you skip the 2015 figure, so that trend is only half shown.",
            fa: "بزرگ‌ترین تغییرها را خوب مقایسه کرده‌اید، ولی برای بازی‌های ویدیویی عدد سال ۲۰۱۵ را نیاورده‌اید و این روند فقط نیمه‌کاره نشان داده شده است.",
          },
          example: "grew steadily from 3 to 8 hours",
        },
        {
          key: "data-accuracy",
          label: { en: "Data accuracy", fa: "دقت در عددها" },
          score: 74,
          verdict: "good",
          note: {
            en: "Most figures are reported accurately with their years, and you even mention the small peak for sport in 2015.",
            fa: "بیشتر عددها را درست و همراه با سالشان آورده‌اید و حتی به اوج کوچک ورزش در سال ۲۰۱۵ هم اشاره کرده‌اید.",
          },
          example: "with a small peak of 6 hours in 2015",
        },
      ],
      tips: [
        {
          en: "Give the figure for every year of each activity, including the middle year, so every trend is complete.",
          fa: "برای هر فعالیت عدد همهٔ سال‌ها، از جمله سال وسط، را بیاورید تا هر روند کامل دیده شود.",
        },
        {
          en: "In the overview, also name the most popular activity at the start and at the end, for example that social media overtook TV.",
          fa: "در جمع‌بندی کلی بگویید کدام فعالیت در ابتدا و کدام در انتها از همه محبوب‌تر بود، مثلاً اینکه شبکه‌های اجتماعی از تلویزیون جلو زدند.",
        },
      ],
    },
    {
      key: "cc",
      band: 6,
      comment: {
        en: "The paragraphs follow a logical order and linkers such as 'Similarly' and 'On the other hand' work well. In the sentence with 'however', two clauses are joined only by a comma, which breaks the flow.",
        fa: "ترتیب پاراگراف‌ها منطقی است و کلمه‌های ربطی مثل «Similarly» و «On the other hand» درست کار می‌کنند. در جمله‌ای که «however» دارد، دو جمله فقط با یک ویرگول به هم چسبیده‌اند و روانی متن به هم می‌خورد.",
      },
      metrics: [
        {
          key: "paragraphing",
          label: { en: "Paragraphing", fa: "پاراگراف‌بندی" },
          score: 66,
          verdict: "good",
          note: {
            en: "You have a clear introduction, overview and two body paragraphs. The second body paragraph mixes a rising activity with a stable one, so the grouping is less clear.",
            fa: "مقدمه، جمع‌بندی کلی و دو پاراگراف بدنهٔ روشن دارید. پاراگراف بدنهٔ دوم یک فعالیت رو به افزایش را با یک فعالیت ثابت قاطی کرده و برای همین دسته‌بندی‌اش کمتر روشن است.",
          },
          example: "Video games also grew steadily",
        },
        {
          key: "linking-words",
          label: { en: "Linking words", fa: "کلمه‌های ربط" },
          score: 52,
          verdict: "acceptable",
          note: {
            en: "'Similarly' and 'On the other hand' work well, but 'however' after a comma cannot join two clauses.",
            fa: "«Similarly» و «On the other hand» خوب کار می‌کنند، ولی «however» بعد از ویرگول نمی‌تواند دو جمله را به هم وصل کند.",
          },
          example: "in 2005, however it rose dramatically",
        },
        {
          key: "referencing",
          label: { en: "Referencing", fa: "ارجاع" },
          score: 60,
          verdict: "acceptable",
          note: {
            en: "'This figure' and 'which' help you avoid repetition, but most sentences repeat the activity name instead of using 'it' or 'the latter'.",
            fa: "«this figure» و «which» به شما کمک می‌کنند تکرار نکنید، ولی بیشتر جمله‌ها به‌جای «it» یا «the latter» دوباره اسم فعالیت را تکرار می‌کنند.",
          },
          example: "this figure dropped to 10 hours",
        },
      ],
      tips: [
        {
          en: "Use 'However,' only at the start of a new sentence. Inside a sentence, use 'but' or 'while'.",
          fa: "«However,» را فقط در ابتدای جملهٔ تازه بیاورید. وسط جمله از «but» یا «while» استفاده کنید.",
        },
        {
          en: "Group activities by trend: one paragraph for those that fell and one for those that rose.",
          fa: "فعالیت‌ها را بر اساس روندشان دسته‌بندی کنید: یک پاراگراف برای آن‌هایی که کم شدند و یکی برای آن‌هایی که زیاد شدند.",
        },
        {
          en: "Replace some repeated activity names with 'this figure', 'the latter' or 'it'.",
          fa: "به‌جای تکرار اسم فعالیت‌ها، گاهی از «this figure»، «the latter» یا «it» استفاده کنید.",
        },
      ],
    },
    {
      key: "lr",
      band: 6,
      comment: {
        en: "You use good trend language such as 'dropped', 'rose dramatically' and 'grew steadily'. A few phrases are unnatural, for example 'fell down' and 'reached at'.",
        fa: "برای توصیف روندها کلمه‌های خوبی مثل «dropped»، «rose dramatically» و «grew steadily» به کار برده‌اید. چند عبارت طبیعی نیست، مثلاً «fell down» و «reached at».",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "دامنهٔ واژگان" },
          score: 68,
          verdict: "good",
          note: {
            en: "Good trend verbs and adverbs such as 'dropped', 'rose dramatically' and 'grew steadily'.",
            fa: "فعل‌ها و قیدهای خوبی برای توصیف روند به کار برده‌اید، مثل «dropped»، «rose dramatically» و «grew steadily».",
          },
          example: "rose dramatically to 9 hours",
        },
        {
          key: "collocation",
          label: { en: "Collocation", fa: "همایندها" },
          score: 56,
          verdict: "acceptable",
          note: {
            en: "'Spend' goes with 'on', but you use 'in' and 'for' with it, and 'watch TV' does not take 'the'.",
            fa: "فعل «spend» با «on» می‌آید، ولی شما با آن «in» و «for» به کار برده‌اید، و «watch TV» هم حرف تعریف «the» نمی‌گیرد.",
          },
          example: "spent about 5 hours for sport",
        },
        {
          key: "precision",
          label: { en: "Precision", fa: "دقت واژگان" },
          score: 50,
          verdict: "acceptable",
          note: {
            en: "'Fell down' and 'reached at' are not used with numbers, so some of your trend language sounds unnatural.",
            fa: "«fell down» و «reached at» برای عدد و آمار به کار نمی‌روند، برای همین بخشی از توصیف روندها طبیعی به نظر نمی‌رسد.",
          },
          example: "fell down from 4 hours to 2 hours",
        },
      ],
      tips: [
        {
          en: "Learn trend verbs as full patterns: 'fell to 2 hours', 'reached 15 hours', 'rose by 5 hours'.",
          fa: "فعل‌های روند را با الگوی کاملشان یاد بگیرید: «fell to 2 hours»، «reached 15 hours»، «rose by 5 hours».",
        },
        {
          en: "Learn 'spend time on' and 'watch TV' as fixed phrases.",
          fa: "«spend time on» و «watch TV» را به‌شکل عبارت ثابت حفظ کنید.",
        },
        {
          en: "Add one or two less common words, such as 'overtook' or 'remained stable'.",
          fa: "یکی دو کلمهٔ کمتر رایج هم اضافه کنید، مثل «overtook» یا «remained stable».",
        },
      ],
    },
    {
      key: "gra",
      band: 5.5,
      comment: {
        en: "Simple sentences are mostly correct, but there are agreement, article and tense errors, such as 'The bar chart illustrate' and 'has decreased' for a finished period.",
        fa: "جمله‌های ساده بیشتر درست‌اند، ولی خطای مطابقت فعل و فاعل، حرف تعریف و زمان فعل دیده می‌شود، مثل «The bar chart illustrate» و استفاده از «has decreased» برای دوره‌ای که تمام شده است.",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "تنوع ساختارها" },
          score: 58,
          verdict: "acceptable",
          note: {
            en: "You use the past simple, comparisons and a relative clause, which is enough for a short report but shows little variety.",
            fa: "از گذشتهٔ ساده، مقایسه و یک جملهٔ موصولی استفاده کرده‌اید که برای یک گزارش کوتاه کافی است، ولی تنوع زیادی ندارد.",
          },
          example: "which made it the most popular activity",
        },
        {
          key: "accuracy",
          label: { en: "Accuracy", fa: "دقت دستوری" },
          score: 42,
          verdict: "needs-work",
          note: {
            en: "Errors with verb endings, articles and tense appear in most paragraphs, starting with the first sentence.",
            fa: "خطای پایانهٔ فعل، حرف تعریف و زمان فعل تقریباً در هر پاراگراف دیده می‌شود، از همان جملهٔ اول.",
          },
          example: "The bar chart illustrate",
        },
        {
          key: "complex-sentences",
          label: { en: "Complex sentences", fa: "جمله‌های مرکب" },
          score: 55,
          verdict: "acceptable",
          note: {
            en: "Your longest sentence links three ideas with 'however' and 'which', but the comma splice and the missing 'the' in 'the end of the period' weaken it.",
            fa: "طولانی‌ترین جمله‌تان سه ایده را با «however» و «which» به هم وصل می‌کند، ولی ویرگول نابه‌جا و «the» جاافتاده در «the end of the period» آن را ضعیف کرده است.",
          },
          example: "at the end of period",
        },
      ],
      tips: [
        {
          en: "Reread every sentence once only for verb endings: a singular subject needs a verb ending in -s.",
          fa: "هر جمله را یک بار فقط برای پایانهٔ فعل دوباره بخوانید: فاعل مفرد فعلی با «s» در آخر می‌خواهد.",
        },
        {
          en: "When all the years are in the past, keep the past simple for the whole report.",
          fa: "وقتی همهٔ سال‌ها در گذشته‌اند، در کل گزارش از گذشتهٔ ساده استفاده کنید.",
        },
        {
          en: "Check the articles in fixed phrases: 'the same', 'at the end of the period', 'watch TV'.",
          fa: "حرف تعریف را در عبارت‌های ثابت چک کنید: «the same»، «at the end of the period»، «watch TV».",
        },
      ],
    },
  ],
  annotations: [
    {
      quote: "The bar chart illustrate",
      kind: "grammar",
      note: {
        en: "A singular subject needs a verb ending in -s in the present simple.",
        fa: "فاعل مفرد است، پس فعل در زمان حال ساده باید «s» بگیرد.",
      },
      fix: "The bar chart illustrates",
    },
    {
      quote: "spent in five leisure activities",
      kind: "grammar",
      note: {
        en: "We spend time on an activity, not in it.",
        fa: "در انگلیسی وقت را «on» یک کار می‌گذرانیم، نه «in» آن.",
      },
      fix: "spent on five leisure activities",
    },
    {
      quote: "reading for pleasure has decreased",
      kind: "grammar",
      note: {
        en: "The period ended in 2025 and the rest of the sentence uses the past simple, so keep the tenses the same.",
        fa: "دوره در سال ۲۰۲۵ تمام شده و بقیهٔ جمله هم گذشتهٔ ساده است، پس زمان فعل‌ها را یکی نگه دارید.",
      },
      fix: "reading for pleasure decreased",
    },
    {
      quote: "almost same",
      kind: "grammar",
      note: {
        en: "'Same' almost always takes 'the'.",
        fa: "کلمهٔ «same» تقریباً همیشه با «the» می‌آید.",
      },
      fix: "almost the same",
    },
    {
      quote: "watching the TV",
      kind: "grammar",
      note: {
        en: "No article in the fixed phrase 'watch TV'.",
        fa: "در عبارت ثابت «watch TV» حرف تعریف نمی‌آید.",
      },
      fix: "watching TV",
    },
    {
      quote: "fell down",
      kind: "vocabulary",
      note: {
        en: "'Fall down' is for people and objects. For numbers, use 'fell' or 'declined'.",
        fa: "«fall down» برای زمین خوردن آدم یا اشیاست. برای عدد و آمار فقط «fell» یا «declined» بنویسید.",
      },
      fix: "fell",
    },
    {
      quote: "in 2005, however it rose dramatically",
      kind: "cohesion",
      note: {
        en: "'However' cannot join two clauses with a comma. Use 'but', or start a new sentence with 'However,'.",
        fa: "«however» نمی‌تواند با یک ویرگول دو جمله را به هم وصل کند. یا از «but» استفاده کنید یا جملهٔ تازه‌ای با «However,» شروع کنید.",
      },
      fix: "in 2005, but it rose dramatically",
    },
    {
      quote: "reached at 15 hours",
      kind: "vocabulary",
      note: {
        en: "'Reach' takes a direct object, with no preposition.",
        fa: "فعل «reach» مفعول مستقیم می‌گیرد و حرف اضافه نمی‌خواهد.",
      },
      fix: "reached 15 hours",
    },
    {
      quote: "grew steadily from 3 to 8 hours",
      kind: "task",
      note: {
        en: "Add the 2015 figure (6 hours) so the reader can see the trend was steady.",
        fa: "عدد سال ۲۰۱۵ (۶ ساعت) را هم بیاورید تا خواننده ببیند روند واقعاً یکنواخت بوده است.",
      },
      fix: "grew steadily from 3 hours in 2005 to 6 in 2015 and 8 in 2025",
    },
    {
      quote: "spent about 5 hours for sport",
      kind: "grammar",
      note: {
        en: "Again, 'spend time on' something.",
        fa: "اینجا هم باید «spend time on» بنویسید.",
      },
      fix: "spent about 5 hours on sport",
    },
  ],
  summary: {
    en: "Your overview is clear and every activity is covered, which keeps Task Achievement strong. Small grammar slips (verb endings, articles and prepositions) hold the band at 6.0. Next time, reread each sentence once only for 'the', 'on/in' and verb endings.",
    fa: "overview واضحه و همه‌ی فعالیت‌ها پوشش داده شدن، برای همین Task Achievement قویه. اشتباه‌های کوچیک گرامری (آخر فعل‌ها، حرف تعریف و حرف اضافه) Band رو روی ۶٫۰ نگه داشتن. دفعه‌ی بعد، هر جمله رو یک بار فقط برای «the»، «on/in» و آخر فعل‌ها دوباره بخون.",
  },
  dummy: true,
};

/* ------------------------------------------------------------------ */
/*  Writing Task 2 (band 6.0)                                          */
/* ------------------------------------------------------------------ */

const task2Essay = `Nowadays, in many countries the young adults continue to live with their parents until they are almost thirty years old. Some people think this situation is beneficial for families, but others believe that it damage the independence of young generation. In this essay I will discuss both views and give my own opinion.

On the one hand, living together has some clear advantages for families. Firstly, housing in big cities like Tehran is extremely expensive, so young people can save money for their future if they stayed at home. Secondly, parents who are getting older can receive daily help from their children, for example with shopping or visiting the doctor. In my country, family relationship is very important and many people believes that a strong family is the base of a healthy society.

On the other hand, some people argue that this habit make young people dependent. When a young man lives with his parents, his mother usually cook the meals and his father pay the bills, so he never learn how to manage his own life. As a result, when they finally move out, they face with many problems which they did not expect them. Moreover, sharing a house can cause conflicts between generations, because young people want more privacy and freedom.

In my opinion, although living with parents has financial benefits, young adults should try to become independent as soon as possible. If they cannot leave home yet, they should at least pay part of the expenses and do their share of the housework.

To sum up, both sides have reasonable arguments. However, I believe that independence is more valuable in the long term, and families should encourage their children to stand on their own feet.`;

export const writingFeedbackTask2: WritingFeedback = {
  partId: "a1-w-p2",
  task: 2,
  words: 288,
  essay: task2Essay,
  band: 6,
  criteria: [
    {
      key: "tr",
      band: 6,
      comment: {
        en: "You discuss both views and give a clear opinion, with relevant examples about housing and family life. The opinion only appears in the second half, and the 'independence' side needs one more developed example.",
        fa: "هر دو دیدگاه را بررسی کرده‌اید و نظر روشنی داده‌اید، با مثال‌های مرتبط دربارهٔ مسکن و زندگی خانوادگی. ولی نظرتان فقط در نیمهٔ دوم مقاله آمده و بخش مربوط به «استقلال» به یک مثال کامل‌تر نیاز دارد.",
      },
      metrics: [
        {
          key: "position",
          label: { en: "Position", fa: "موضع" },
          score: 56,
          verdict: "acceptable",
          note: {
            en: "Your opinion is clear but only appears in the fourth paragraph. The introduction repeats the question instead of stating your view.",
            fa: "نظرتان روشن است ولی فقط در پاراگراف چهارم می‌آید. مقدمه به‌جای بیان دیدگاه شما فقط صورت سؤال را تکرار می‌کند.",
          },
          example: "In this essay I will discuss both views and give my own opinion.",
        },
        {
          key: "development",
          label: { en: "Development", fa: "گسترش ایده‌ها" },
          score: 52,
          verdict: "acceptable",
          note: {
            en: "The family side has two reasons with examples, but the independence side rests on one general example about a young man.",
            fa: "طرف خانواده دو دلیل همراه با مثال دارد، ولی طرف استقلال فقط به یک مثال کلی دربارهٔ یک مرد جوان تکیه می‌کند.",
          },
          example: "When a young man lives with his parents",
        },
        {
          key: "relevance",
          label: { en: "Relevance", fa: "ارتباط با سؤال" },
          score: 72,
          verdict: "good",
          note: {
            en: "Every paragraph stays on the question, and the example about housing in Tehran is specific and relevant.",
            fa: "همهٔ پاراگراف‌ها به سؤال مربوط‌اند و مثال مسکن در تهران مشخص و مرتبط است.",
          },
          example: "housing in big cities like Tehran is extremely expensive",
        },
      ],
      tips: [
        {
          en: "State your opinion in one short sentence in the introduction, then repeat it in the conclusion.",
          fa: "نظرتان را در مقدمه در یک جملهٔ کوتاه بگویید و در نتیجه‌گیری دوباره تکرارش کنید.",
        },
        {
          en: "Develop each body idea with a reason, an example and a result, especially on the independence side.",
          fa: "هر ایدهٔ پاراگراف‌های بدنه را با یک دلیل، یک مثال و یک نتیجه گسترش دهید، مخصوصاً در بخش استقلال.",
        },
        {
          en: "Drop memorised openers that only repeat the question, and use the space for your own ideas.",
          fa: "جمله‌های حفظی را که فقط سؤال را تکرار می‌کنند کنار بگذارید و از آن جا برای ایده‌های خودتان استفاده کنید.",
        },
      ],
    },
    {
      key: "cc",
      band: 6,
      comment: {
        en: "Each body paragraph holds one idea and the linking is clear ('Firstly', 'As a result', 'Moreover'). Some linkers are mechanical, and 'they' and 'he' switch within the same paragraph.",
        fa: "هر پاراگراف بدنه یک ایدهٔ اصلی دارد و ارتباط جمله‌ها روشن است (مثل «Firstly»، «As a result» و «Moreover»). بعضی کلمه‌های ربط کلیشه‌ای‌اند و در یک پاراگراف ضمیر بین «he» و «they» عوض می‌شود.",
      },
      metrics: [
        {
          key: "paragraphing",
          label: { en: "Paragraphing", fa: "پاراگراف‌بندی" },
          score: 70,
          verdict: "good",
          note: {
            en: "Five well-balanced paragraphs, and each body paragraph opens with a clear topic sentence.",
            fa: "پنج پاراگراف متعادل دارید و هر پاراگراف بدنه با یک جملهٔ موضوعی روشن شروع می‌شود.",
          },
          example: "On the one hand, living together has some clear advantages for families.",
        },
        {
          key: "linking-words",
          label: { en: "Linking words", fa: "کلمه‌های ربط" },
          score: 58,
          verdict: "acceptable",
          note: {
            en: "Linkers are accurate but mechanical: 'Firstly', 'Secondly', 'Moreover' and 'As a result' all open sentences the same way.",
            fa: "کلمه‌های ربط درست‌اند ولی کلیشه‌ای: «Firstly»، «Secondly»، «Moreover» و «As a result» همه جمله‌ها را به یک شکل شروع می‌کنند.",
          },
          example: "Moreover, sharing a house can cause conflicts",
        },
        {
          key: "referencing",
          label: { en: "Referencing", fa: "ارجاع" },
          score: 50,
          verdict: "acceptable",
          note: {
            en: "In the third paragraph, 'a young man' becomes 'he' and then 'they', so the reader loses track of who you mean.",
            fa: "در پاراگراف سوم «a young man» اول «he» می‌شود و بعد «they»، و خواننده نمی‌فهمد منظورتان چه کسی است.",
          },
          example: "when they finally move out",
        },
      ],
      tips: [
        {
          en: "Keep one pronoun for the same person or group: if you start with 'young people', continue with 'they'.",
          fa: "برای یک شخص یا گروه همیشه از یک ضمیر استفاده کنید: اگر با «young people» شروع کردید، با «they» ادامه دهید.",
        },
        {
          en: "Link some ideas inside the sentence with 'which means' or 'so', instead of starting every sentence with a linker.",
          fa: "به‌جای اینکه هر جمله را با کلمهٔ ربط شروع کنید، بعضی ایده‌ها را وسط جمله با «which means» یا «so» به هم وصل کنید.",
        },
      ],
    },
    {
      key: "lr",
      band: 6.5,
      comment: {
        en: "Good topic vocabulary such as 'financial benefits', 'conflicts between generations' and 'stand on their own feet'. A few word choices are slightly off, for example 'the base of a healthy society'.",
        fa: "واژه‌های مرتبط با موضوع خوب انتخاب شده‌اند، مثل «financial benefits»، «conflicts between generations» و «stand on their own feet». چند واژه هم کمی نادرست انتخاب شده‌اند، مثلاً «the base of a healthy society».",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "دامنهٔ واژگان" },
          score: 74,
          verdict: "good",
          note: {
            en: "Good topic vocabulary, and a natural idiom used correctly.",
            fa: "واژه‌های مرتبط با موضوع خوب‌اند و یک اصطلاح طبیعی را درست به کار برده‌اید.",
          },
          example: "stand on their own feet",
        },
        {
          key: "collocation",
          label: { en: "Collocation", fa: "همایندها" },
          score: 70,
          verdict: "good",
          note: {
            en: "Natural word pairs such as 'financial benefits' and 'conflicts between generations'.",
            fa: "ترکیب‌های طبیعی مثل «financial benefits» و «conflicts between generations» به کار برده‌اید.",
          },
          example: "conflicts between generations",
        },
        {
          key: "precision",
          label: { en: "Precision", fa: "دقت واژگان" },
          score: 58,
          verdict: "acceptable",
          note: {
            en: "A few word choices are slightly off, such as 'base' where 'foundation' is the natural word, and 'face with'.",
            fa: "چند واژه کمی نادرست انتخاب شده‌اند، مثل «base» به‌جای «foundation» و «face with».",
          },
          example: "the base of a healthy society",
        },
      ],
      tips: [
        {
          en: "Learn verbs together with their patterns, for example 'face problems' with no preposition.",
          fa: "فعل‌ها را همراه با الگویشان یاد بگیرید، مثلاً «face problems» بدون حرف اضافه.",
        },
        {
          en: "Paraphrase the words of the question, for example 'stay in the family home' for 'live with their parents'.",
          fa: "کلمه‌های صورت سؤال را با عبارت‌های دیگر بیان کنید، مثلاً به‌جای «live with their parents» بنویسید «stay in the family home».",
        },
        {
          en: "Keep a list of words for abstract ideas, such as 'foundation', 'pillar' and 'cornerstone'.",
          fa: "برای مفهوم‌های انتزاعی فهرستی از واژه‌ها نگه دارید، مثل «foundation»، «pillar» و «cornerstone».",
        },
      ],
    },
    {
      key: "gra",
      band: 5.5,
      comment: {
        en: "You try a good range of complex sentences, but many of them have subject–verb agreement or tense errors, such as 'this habit make' and 'if they stayed at home'. These errors are frequent enough to lower the band.",
        fa: "جمله‌های مرکب متنوعی امتحان می‌کنی، ولی خیلی‌هاشون خطای مطابقت فعل و فاعل یا زمان دارن، مثل «this habit make» و «if they stayed at home». این خطاها اون‌قدر تکرار می‌شن که Band رو پایین میارن.",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "تنوع ساختارها" },
          score: 64,
          verdict: "acceptable",
          note: {
            en: "You attempt conditionals, relative clauses and 'although' clauses, a good range for this band.",
            fa: "از جمله‌های شرطی، relative clause و جمله‌های «although» استفاده می‌کنی؛ برای این Band تنوع خوبیه.",
          },
          example: "although living with parents has financial benefits",
        },
        {
          key: "accuracy",
          label: { en: "Accuracy", fa: "دقت دستوری" },
          score: 38,
          verdict: "needs-work",
          note: {
            en: "Subject–verb agreement errors appear in almost every paragraph, three of them in a single sentence.",
            fa: "خطای مطابقت فعل و فاعل تقریباً در هر پاراگراف هست و سه تا از آن‌ها در یک جمله آمده است.",
          },
          example: "his mother usually cook the meals and his father pay the bills",
        },
        {
          key: "complex-sentences",
          label: { en: "Complex sentences", fa: "جمله‌های مرکب" },
          score: 50,
          verdict: "acceptable",
          note: {
            en: "Many complex sentences break down, for example a past verb in a present conditional and an extra 'them' after 'which'.",
            fa: "خیلی از جمله‌های مرکب خراب می‌شوند، مثلاً فعل گذشته در یک جملهٔ شرطی زمان حال و «them» اضافه بعد از «which».",
          },
          example: "which they did not expect them",
        },
      ],
      tips: [
        {
          en: "Before you finish, find every 'he', 'she', 'it' and singular noun, and check that its verb ends in -s.",
          fa: "قبل از تموم کردن، همه‌ی «he»، «she»، «it» و اسم‌های مفرد رو پیدا کن و چک کن فعلشون ‎-s داشته باشه.",
        },
        {
          en: "In first conditionals, keep both clauses in the present: 'if they stay at home, they can save money'.",
          fa: "توی first conditional هر دو بخش جمله رو حال نگه دار: «if they stay at home, they can save money».",
        },
        {
          en: "After 'which' or 'who', do not repeat the object as a pronoun.",
          fa: "بعد از «which» یا «who»، مفعول رو دوباره با ضمیر تکرار نکن.",
        },
      ],
    },
  ],
  annotations: [
    {
      quote: "in many countries the young adults",
      kind: "grammar",
      note: {
        en: "When you talk about a group in general, use no article.",
        fa: "وقتی درباره‌ی یه گروه به‌طور کلی حرف می‌زنی، article لازم نیست.",
      },
      fix: "in many countries young adults",
    },
    {
      quote: "it damage the independence of young generation",
      kind: "grammar",
      note: {
        en: "'It' needs 'damages', and 'generation' needs an article here.",
        fa: "«It» فعل «damages» می‌خواد و «generation» اینجا article لازم داره.",
      },
      fix: "it damages the independence of the younger generation",
    },
    {
      quote: "In this essay I will discuss both views and give my own opinion.",
      kind: "task",
      note: {
        en: "A memorised sentence that repeats the question. Use this space to state your position in a few words.",
        fa: "یه جمله‌ی حفظی که فقط سؤال رو تکرار می‌کنه. از این فضا استفاده کن تا نظرت رو در چند کلمه بگی.",
      },
      fix: "In my view, the benefits are real, but independence matters more in the long run.",
    },
    {
      quote: "if they stayed at home",
      kind: "grammar",
      note: {
        en: "The main clause is in the present ('can save'), so the if-clause should be present too.",
        fa: "جمله‌ی اصلی زمان حاله («can save»)، پس بخش if هم باید حال باشه.",
      },
      fix: "if they stay at home",
    },
    {
      quote: "family relationship is very important and many people believes",
      kind: "grammar",
      note: {
        en: "'Family relationships' is a general plural idea, and 'people' is plural, so the verbs change.",
        fa: "«Family relationships» یه مفهوم کلی و جمعه و «people» هم جمعه، پس فعل‌ها عوض می‌شن.",
      },
      fix: "family relationships are very important and many people believe",
    },
    {
      quote: "the base of a healthy society",
      kind: "vocabulary",
      note: {
        en: "For an idea or institution, 'foundation' is the natural word.",
        fa: "برای یه ایده یا نهاد، «foundation» کلمه‌ی طبیعی‌تریه.",
      },
      fix: "the foundation of a healthy society",
    },
    {
      quote: "this habit make young people dependent",
      kind: "grammar",
      note: {
        en: "Singular subject, so 'makes'.",
        fa: "فاعل مفرده، پس «makes».",
      },
      fix: "this habit makes young people dependent",
    },
    {
      quote: "his mother usually cook the meals and his father pay the bills, so he never learn",
      kind: "grammar",
      note: {
        en: "Three agreement errors in one sentence. Each singular subject needs a verb ending in -s.",
        fa: "سه خطای مطابقت توی یه جمله. هر فاعل مفرد فعلی با ‎-s می‌خواد.",
      },
      fix: "his mother usually cooks the meals and his father pays the bills, so he never learns",
    },
    {
      quote: "they face with many problems which they did not expect them",
      kind: "grammar",
      note: {
        en: "'Face' takes a direct object, and 'which' already replaces 'them', so delete the extra pronoun.",
        fa: "«Face» مفعول مستقیم می‌گیره و «which» خودش جای «them» نشسته، پس ضمیر اضافه رو حذف کن.",
      },
      fix: "they face many problems which they did not expect",
    },
    {
      quote: "stand on their own feet",
      kind: "vocabulary",
      note: {
        en: "Natural idiom, used correctly. Keep using phrases like this.",
        fa: "یه اصطلاح طبیعی که درست به کار رفته. از این عبارت‌ها بیشتر استفاده کن.",
      },
    },
  ],
  summary: {
    en: "Your paragraphs hold one idea each and your linking is clear. Grammar is what holds the band down: many complex sentences had tense or agreement errors. Next, check every verb against its subject before you finish, especially after 'he', 'it' and 'this'.",
    fa: "هر پاراگرافت یه ایده‌ی اصلی داره و ارتباط جمله‌هات واضحه. چیزی که Band رو پایین نگه می‌داره گرامره: خیلی از جمله‌های مرکبت خطای زمان یا مطابقت فعل و فاعل داشتن. قدم بعدی: قبل از تموم کردن، هر فعل رو با فاعلش چک کن، مخصوصاً بعد از «he»، «it» و «this».",
  },
  dummy: true,
};

/* ------------------------------------------------------------------ */
/*  Earlier Task 2 essays (seeded past mocks)                          */
/* ------------------------------------------------------------------ */

const olderEssay1 = `Nowadays, many companies let their employees to work from home, especially after the Corona. In my opinion the advantages of this trend is more than its disadvantages, although there are some problems too.

First of all, working from home save a lot of time. In big cities like Tehran, people spend two or three hours in the traffic every day, and this time can be used for family or for rest. Also, the pollution of the air will be reduced if less cars are on the streets. For example, my uncle is a programmer and since he works at home, he is more relax and he has more energy for his children.

Secondly, companies can save money because they don't need big offices. They can use this money for give better salary to the workers.

However, working from home has some disadvantages. Some people cannot focus at home because there are many distractions, like children or television. In addition, the employees feel lonely and they don't have a good relationship with their colleagues. Also the internet in some countries is very slow and it make problems for online meetings.

In conclusion, I believe that working from home has more advantages than disadvantages, because it save time and money and it is good for the environment. But the companies should solve the problems like loneliness by having meeting in the office once a week.`;

const olderEssay2 = `Today, English is the international language and every people need it for work and study. Some people believe that children should begin to learn a foreign language in primary school instead of secondary school. I completely agree with this opinion.

The first reason is that young children learn languages more easier than adults. Their brain is like a sponge and they can copy the pronunciation of native speakers very well. For instance, my little cousin who is seven years old, he learned many English words from cartoons and his accent is better than me. In my experience, students who started English in primary school usually have more confidence when they speak.

The second reason is that when the children start early, they have more time for practise. If a student start English at age of thirteen, he has only five or six years before university, and it is not enough for learning a language completely. Also, they can watch cartoons and play games in English, which make learning more fun.

On the other hand, some people says that young children should first learn their mother language correctly, and learning two language at the same time can confuse them. Also, in many primary schools there is not enough qualified teachers. I think these problems are real, but the government can solve them by training teachers.

To conclude, I strongly believe that learning a foreign language at primary school is a good idea, because children learn faster and they have more time. Parents and government should support this programs for the future of the children.`;

const olderEssay3 = `In many cities around the world, traditional markets are disappearing and large shopping centres are being built instead of them. This essay will explain the reasons for this change and argue that it is mostly a negative development.

There are several reasons why shopping centres have become so popular. The main reason is convenience. In a shopping centre, people can find everything under one roof, from clothes to food, and they can also park their car easily. Another reason is that shopping centres are air-conditioned and clean, which is important in hot cities, for example in Ahvaz the temperature reach to fifty degrees in summer. Finally, young people consider shopping centres as a place for entertainment, because there are cinemas and cafes in them.

However, I believe this trend has more negative effects than positive. Firstly, traditional markets like the Grand Bazaar of Tehran are part of the history and identity of a city, and when they are closed, a piece of culture is lost. Secondly, small shopkeepers can not compete with big brands, so many families lose their income. For example, in my neighbourhood three small shops closed after a big mall opened nearby. Although shopping centres create new jobs, most of them are low-paid and temporary.

In conclusion, shopping centres are popular because they are convenient, comfortable and entertaining. Nevertheless, in my opinion the disappearance of traditional markets is a negative development, since it damages both the culture and the local economy. Governments should protect historical markets and help small shopkeepers to modernise their business.`;

export const writingFeedbackTask2Older: WritingFeedback[] = [
  {
    partId: "a1-w-p2",
    task: 2,
    words: 233,
    essay: olderEssay1,
    band: 5.5,
    criteria: [
      {
        key: "tr",
        band: 5.5,
        comment: {
          en: "Your position is clear and you cover both sides, but the essay is under 250 words and the second advantage has only one short sentence.",
          fa: "موضع شما روشن است و هر دو طرف را پوشش داده‌اید، ولی مقاله کمتر از ۲۵۰ کلمه است و مزیت دوم فقط یک جملهٔ کوتاه دارد.",
        },
      },
      {
        key: "cc",
        band: 6,
        comment: {
          en: "Clear paragraphing and a logical order. Linkers like 'First of all' and 'Secondly' help, though 'Also' is overused.",
          fa: "پاراگراف‌بندی روشن است و ترتیب منطقی دارد. کلمه‌هایی مثل «First of all» و «Secondly» کمک می‌کنند، هرچند «Also» زیادی تکرار شده است.",
        },
      },
      {
        key: "lr",
        band: 5.5,
        comment: {
          en: "Vocabulary is adequate for the topic but repetitive ('save', 'money', 'problems'), with some word-form errors such as 'more relax'.",
          fa: "واژگان برای موضوع کافی است ولی تکراری است («save»، «money»، «problems») و چند خطای ساخت کلمه دارد، مثل «more relax».",
        },
      },
      {
        key: "gra",
        band: 5,
        comment: {
          en: "Frequent agreement errors ('working from home save', 'it make') and some verb patterns are wrong ('let their employees to work').",
          fa: "خطای مطابقت فعل و فاعل زیاد است («working from home save»، «it make») و بعضی الگوهای فعل نادرست‌اند («let their employees to work»).",
        },
      },
    ],
    annotations: [
      {
        quote: "let their employees to work",
        kind: "grammar",
        note: { en: "'Let' is followed by the base verb without 'to'.", fa: "بعد از «Let» فعل ساده بدون «to» میاد." },
        fix: "let their employees work",
      },
      {
        quote: "the advantages of this trend is more than its disadvantages",
        kind: "grammar",
        note: {
          en: "'Advantages' is plural, and 'outweigh' says this more naturally.",
          fa: "«advantages» جمع است و فعل «outweigh» این معنی را طبیعی‌تر می‌رساند.",
        },
        fix: "the advantages of this trend outweigh its disadvantages",
      },
      {
        quote: "working from home save a lot of time",
        kind: "grammar",
        note: { en: "A gerund subject is singular, so 'saves'.", fa: "وقتی فاعل یک فعل ingدار (gerund) است، مفرد حساب می‌شود، پس «saves»." },
        fix: "working from home saves a lot of time",
      },
      {
        quote: "less cars",
        kind: "vocabulary",
        note: { en: "Use 'fewer' with countable nouns.", fa: "با اسم‌های قابل شمارش از «fewer» استفاده کنید." },
        fix: "fewer cars",
      },
      {
        quote: "he is more relax",
        kind: "vocabulary",
        note: { en: "You need the adjective form here.", fa: "اینجا شکل صفتی کلمه لازم است." },
        fix: "he is more relaxed",
      },
      {
        quote: "They can use this money for give better salary to the workers.",
        kind: "task",
        note: {
          en: "This idea needs development: explain why better salaries matter, or give an example.",
          fa: "این ایده باید گسترش پیدا کند: توضیح بدهید چرا حقوق بهتر مهم است یا یک مثال بیاورید.",
        },
        fix: "They can use this money to pay their staff better, which helps them keep skilled workers.",
      },
      {
        quote: "it make problems for online meetings",
        kind: "grammar",
        note: { en: "'It' needs 'makes', and 'causes problems' is more natural.", fa: "با «it» فعل «makes» می‌آید و «causes problems» طبیعی‌تر است." },
        fix: "it causes problems for online meetings",
      },
    ],
    summary: {
      en: "Your plan is clear, but the essay is short and grammar errors appear in almost every paragraph. Next time, aim for 260–280 words and develop each body idea with a reason and an example.",
      fa: "طرح کلی مقاله روشن است، ولی متن کوتاه است و تقریباً در هر پاراگراف خطای دستوری دیده می‌شود. دفعهٔ بعد ۲۶۰ تا ۲۸۰ کلمه بنویسید و هر ایدهٔ پاراگراف‌های بدنه را با یک دلیل و یک مثال گسترش دهید.",
    },
    dummy: true,
  },
  {
    partId: "a1-w-p2",
    task: 2,
    words: 263,
    essay: olderEssay2,
    band: 5.5,
    criteria: [
      {
        key: "tr",
        band: 6,
        comment: {
          en: "A clear 'agree' position kept throughout, with relevant reasons. The counter-argument is mentioned but answered only briefly.",
          fa: "موضع «موافقم» از اول تا آخر روشن مانده و دلیل‌ها مرتبط‌اند. دیدگاه مخالف مطرح شده ولی خیلی کوتاه جواب داده شده است.",
        },
      },
      {
        key: "cc",
        band: 5.5,
        comment: {
          en: "Paragraphs are clear, but 'On the other hand' introduces a counter-view that does not contrast with the previous paragraph, and some referencing is confusing ('he' after 'my little cousin who…').",
          fa: "پاراگراف‌ها روشن‌اند، ولی «On the other hand» دیدگاهی را معرفی می‌کند که با پاراگراف قبل در تضاد نیست، و بعضی ارجاع‌ها گیج‌کننده‌اند (مثل «he» بعد از «my little cousin who…»).",
        },
      },
      {
        key: "lr",
        band: 5.5,
        comment: {
          en: "Some good phrases ('like a sponge', 'qualified teachers'), but frequent errors in word form and countability ('every people', 'two language').",
          fa: "چند عبارت خوب دارید («like a sponge»، «qualified teachers»)، ولی خطا در شکل کلمه و قابل شمارش بودن زیاد است («every people»، «two language»).",
        },
      },
      {
        key: "gra",
        band: 5,
        comment: {
          en: "Many basic errors with comparatives, agreement and plurals ('more easier', 'some people says', 'this programs').",
          fa: "خطاهای پایه‌ای زیادی در صفت تفضیلی، مطابقت فعل و جمع بستن دیده می‌شود («more easier»، «some people says»، «this programs»).",
        },
      },
    ],
    annotations: [
      {
        quote: "every people need it",
        kind: "grammar",
        note: { en: "'Every' takes a singular noun and verb.", fa: "بعد از «every» اسم و فعل مفرد می‌آید." },
        fix: "everyone needs it",
      },
      {
        quote: "more easier",
        kind: "grammar",
        note: { en: "Double comparative. Use 'easier' or 'more easily'.", fa: "صفت تفضیلی دوتایی. یا «easier» بنویسید یا «more easily»." },
        fix: "more easily",
      },
      {
        quote: "my little cousin who is seven years old, he learned",
        kind: "grammar",
        note: { en: "Don't repeat the subject with a pronoun.", fa: "فاعل را دوباره با ضمیر تکرار نکنید." },
        fix: "my seven-year-old cousin learned",
      },
      {
        quote: "better than me",
        kind: "grammar",
        note: { en: "Compare accent with accent.", fa: "لهجه را باید با لهجه مقایسه کنید، نه با خود شخص." },
        fix: "better than mine",
      },
      {
        quote: "at age of thirteen",
        kind: "grammar",
        note: { en: "The fixed phrase is 'at the age of'.", fa: "عبارت ثابت «at the age of» است." },
        fix: "at the age of thirteen",
      },
      {
        quote: "some people says",
        kind: "grammar",
        note: { en: "'People' is plural.", fa: "«people» جمع است." },
        fix: "some people say",
      },
      {
        quote: "On the other hand",
        kind: "cohesion",
        note: {
          en: "Use a linker that introduces an opposing view, not a contrast between your own two points.",
          fa: "از کلمهٔ ربطی‌ای استفاده کنید که دیدگاه مخالف را معرفی کند، نه تضاد بین دو نکتهٔ خودتان را.",
        },
        fix: "Admittedly",
      },
    ],
    summary: {
      en: "Your opinion is clear and well supported, but basic grammar errors in nearly every sentence hold the band at 5.5. Focus first on plurals and subject–verb agreement.",
      fa: "نظرتان روشن است و دلیل‌های خوبی برایش آورده‌اید، ولی خطاهای پایه‌ای دستوری در تقریباً هر جمله نمره را روی ۵٫۵ نگه داشته است. اول روی جمع بستن اسم‌ها و مطابقت فعل و فاعل تمرکز کنید.",
    },
    dummy: true,
  },
  {
    partId: "a1-w-p2",
    task: 2,
    words: 257,
    essay: olderEssay3,
    band: 6,
    criteria: [
      {
        key: "tr",
        band: 6,
        comment: {
          en: "Both questions are answered and your position is clear from the introduction. The 'reasons' paragraph is stronger than the 'negative development' paragraph, which could use one more example.",
          fa: "به هر دو سؤال جواب داده‌اید و موضعتان از مقدمه روشن است. پاراگراف «دلیل‌ها» از پاراگراف «پیامد منفی» قوی‌تر است و دومی به یک مثال دیگر نیاز دارد.",
        },
      },
      {
        key: "cc",
        band: 6,
        comment: {
          en: "Good overall structure with a clear topic sentence in each paragraph. Linkers are accurate but a little predictable.",
          fa: "متن ساختار کلی خوبی دارد و هر پاراگراف یک جملهٔ موضوعی روشن دارد. کلمه‌های ربط درست‌اند ولی کمی قابل پیش‌بینی‌اند.",
        },
      },
      {
        key: "lr",
        band: 6,
        comment: {
          en: "Good collocations such as 'under one roof' and 'local economy'. A few errors like 'consider … as' and 'can not'.",
          fa: "همایندهای خوبی مثل «under one roof» و «local economy» به کار برده‌اید. چند خطا هم هست، مثل «consider … as» و «can not».",
        },
      },
      {
        key: "gra",
        band: 5.5,
        comment: {
          en: "A good mix of passive and complex sentences, but some agreement and verb-pattern errors remain ('the temperature reach to').",
          fa: "ترکیب خوبی از جمله‌های مجهول و مرکب دارید، ولی هنوز چند خطای مطابقت و الگوی فعل باقی مانده است («the temperature reach to»).",
        },
      },
    ],
    annotations: [
      {
        quote: "instead of them",
        kind: "grammar",
        note: { en: "Simply say 'in their place', or end with 'instead'.", fa: "بنویسید «in their place» یا جمله را با «instead» تمام کنید." },
        fix: "in their place",
      },
      {
        quote: "which is important in hot cities, for example in Ahvaz",
        kind: "cohesion",
        note: {
          en: "This sentence runs on. Start a new sentence for the example.",
          fa: "جمله بیش از حد طولانی شده است. مثال را در یک جملهٔ جدا بیاورید.",
        },
        fix: "which is important in hot cities. In Ahvaz, for example,",
      },
      {
        quote: "the temperature reach to fifty degrees",
        kind: "grammar",
        note: { en: "Singular subject, and 'reach' takes no preposition.", fa: "فاعل مفرد است و «reach» حرف اضافه نمی‌خواهد." },
        fix: "the temperature reaches fifty degrees",
      },
      {
        quote: "consider shopping centres as a place",
        kind: "vocabulary",
        note: { en: "'Consider' does not take 'as'.", fa: "فعل «consider» با «as» نمی‌آید." },
        fix: "consider shopping centres a place",
      },
      {
        quote: "more negative effects than positive",
        kind: "grammar",
        note: { en: "Add 'ones' so the comparison is complete.", fa: "«ones» را اضافه کنید تا مقایسه کامل شود." },
        fix: "more negative effects than positive ones",
      },
      {
        quote: "can not",
        kind: "vocabulary",
        note: { en: "Write 'cannot' as one word.", fa: "«cannot» را سرهم بنویسید." },
        fix: "cannot",
      },
    ],
    summary: {
      en: "A well-organised essay that answers both questions. Grammar accuracy is the weakest area: most errors are agreement and verb patterns. Next, learn the patterns of ten common verbs such as 'reach', 'consider' and 'face'.",
      fa: "مقالهٔ منظمی است که به هر دو سؤال جواب می‌دهد. ضعیف‌ترین بخش دقت دستوری است و بیشتر خطاها در مطابقت فعل و فاعل و الگوی فعل‌هاست. قدم بعدی: الگوی ده فعل پرکاربرد مثل «reach»، «consider» و «face» را یاد بگیرید.",
    },
    dummy: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Speaking (band 6.5)                                                */
/* ------------------------------------------------------------------ */

const speakingP1 = `Yes, I think I am a morning person, especially in the weekdays. I wake up around six because my university is far from our house and the traffic in Tehran is really terrible.
In the first hour I usually drink a glass of water, then I make tea for me and my mother, and I check my messages. If I have time, I review my vocabulary flashcards on the bus.
Actually, yes, it's quite different. When I was a child, my mother was waking me up every day and I was always late for school. Now I'm more responsible, so I set two alarms.
I believe breakfast is really important, because if I don't eat anything I can't concentrate in my classes. In Iran we usually eat bread, cheese and walnuts, and it gives you energy until lunch.
I take photos almost every day, but most of them are not very serious, just for remembering things, like a notice on the board or a nice view.
I like taking photos from nature, for example mountains and trees in autumn. Last month I went to the north of Iran with my friends and I took more than two hundred photos.
To be honest, I prefer the photos on my phone because it's easier to share them with my family. But printed photos have a special feeling, they are more real.
Yes, there is a photo of my grandparents' wedding in our living room. It's black and white and very old, and every time I look at it I feel proud of my family.`;

const speakingP2 = `I'd like to talk about how I learned to cook rice in the Persian way, with tahdig, from my grandmother. Tahdig is the crispy layer at the bottom of the pot, and in Iran everybody loves it, so it is kind of an important skill in our culture.
My grandmother, who lives in Isfahan, taught it to me when I was about fifteen. I stayed in her house for two weeks in the summer holiday, and every day she was cooking lunch for the whole family. At first I was only watching her, and she explained me every step, for example how long you should soak the rice and when you should add the oil. Then she let me to do it myself. The first time, my tahdig was completely burned and everybody laughed, but she said it is normal.
I think this skill is still useful for me, because now I live in a dormitory and I can cook for myself and my roommates. Also, when I make it, I remember my grandmother, so it is not only about food, it is about family memories.
Yes, I taught it to my roommate last year, and now she makes it better than me.`;

const speakingP3 = `In my country, grandparents usually teach children traditional things, for example cooking, sewing, or growing plants in the garden. Some of them also teach poems from Hafez, because poetry is a big part of our culture.
Yes, I think so, unfortunately. Young people spend most of their time on their phones and they think that everything they need is in the internet. But I believe older people have experience that you cannot find online.
Partly I agree. For example, many people in my generation cannot repair even a simple thing at home, they just buy a new one. But cooking is different, because recently cooking videos became very popular and more young people try to cook.
Definitely. In my opinion schools should teach how to manage money, and also basic first aid. When I finished school I didn't know how to make a budget, and I think it was a big gap in our education system.
Technology has made learning much more faster and easier. Now you can watch a video and learn how to fix a bike in ten minutes, which was impossible in the past. However, sometimes people only watch and never practise, so they don't really learn.
It depends on the skill. For simple skills, online videos are enough, but for complex skills a person is better, because he or she can see your mistakes and correct you immediately. For example, my grandmother noticed that my fire was too high, and a video cannot do that.`;

export const speakingFeedback: SpeakingFeedback = {
  band: 6.5,
  criteria: [
    {
      key: "fc",
      band: 7,
      comment: {
        en: "You speak at length without noticeable effort and extend most answers with reasons and examples. Your Part 2 talk follows the cue card in a clear order.",
        fa: "بدون مکث‌های طولانی و راحت صحبت می‌کنید و بیشتر جواب‌ها را با دلیل و مثال گسترش می‌دهید. صحبتتان در بخش دوم به ترتیب روشنی از نکته‌های کارت پیروی می‌کند.",
      },
      metrics: [
        {
          key: "pace",
          label: { en: "Pace", fa: "سرعت" },
          score: 82,
          verdict: "strong",
          note: {
            en: "You keep a steady, natural speed and talk for almost the full two minutes in Part 2.",
            fa: "با سرعتی ثابت و طبیعی صحبت می‌کنید و در بخش دوم تقریباً تمام دو دقیقه را حرف می‌زنید.",
          },
          example: "I'd like to talk about how I learned to cook rice in the Persian way",
        },
        {
          key: "pausing",
          label: { en: "Pausing", fa: "مکث‌ها" },
          score: 76,
          verdict: "good",
          note: {
            en: "Most pauses fall between ideas rather than in the middle of a phrase, so your answers are easy to follow.",
            fa: "بیشتر مکث‌هایتان بین ایده‌هاست، نه وسط عبارت‌ها، برای همین دنبال کردن جواب‌هایتان راحت است.",
          },
          example: "Actually, yes, it's quite different.",
        },
        {
          key: "hesitations",
          label: { en: "Hesitations", fa: "تردید در صحبت" },
          score: 68,
          verdict: "good",
          note: {
            en: "In Part 3 you hesitate a little when an abstract question needs a new word, and sometimes buy time with a short set phrase first.",
            fa: "در بخش سوم وقتی سؤال انتزاعی کلمهٔ تازه‌ای لازم دارد کمی مکث می‌کنید و گاهی اول با یک عبارت کوتاه آماده وقت می‌خرید.",
          },
          example: "It depends on the skill.",
        },
      ],
      tips: [
        {
          en: "Prepare a few natural ways to start a Part 3 answer, such as 'That's an interesting question. I'd say…', so you never freeze.",
          fa: "چند شروع طبیعی برای جواب‌های بخش سوم آماده کنید، مثل «That's an interesting question. I'd say…»، تا هیچ‌وقت ساکت نمانید.",
        },
        {
          en: "Vary the links between ideas: not only 'because' and 'for example', but also 'on top of that' or 'that said'.",
          fa: "ارتباط بین ایده‌ها را متنوع کنید: نه فقط «because» و «for example»، بلکه «on top of that» یا «that said» هم به کار ببرید.",
        },
        {
          en: "In Part 2, add one more detail or feeling before you stop, so you use the full two minutes.",
          fa: "در بخش دوم قبل از تمام کردن یک جزئیات یا حس دیگر هم اضافه کنید تا از همهٔ دو دقیقه استفاده کنید.",
        },
      ],
    },
    {
      key: "lr",
      band: 6.5,
      comment: {
        en: "Good range for familiar topics ('crispy layer', 'basic first aid', 'make a budget'). Some prepositions after nouns and verbs are wrong, such as 'photos from nature'.",
        fa: "برای موضوع‌های آشنا واژگان خوبی دارید («crispy layer»، «basic first aid»، «make a budget»). بعضی حرف‌های اضافه بعد از اسم و فعل اشتباه است، مثل «photos from nature».",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "دامنهٔ واژگان" },
          score: 74,
          verdict: "good",
          note: {
            en: "You use less common words naturally on familiar topics such as food and education.",
            fa: "در موضوع‌های آشنا مثل غذا و آموزش، واژه‌های کمتر رایج را طبیعی به کار می‌برید.",
          },
          example: "the crispy layer at the bottom of the pot",
        },
        {
          key: "collocation",
          label: { en: "Collocation", fa: "همایندها" },
          score: 70,
          verdict: "good",
          note: {
            en: "Good pairs like 'make a budget' and 'basic first aid', with a few slips such as 'in the internet'.",
            fa: "ترکیب‌های خوبی مثل «make a budget» و «basic first aid» دارید و فقط چند لغزش کوچک مثل «in the internet».",
          },
          example: "how to make a budget",
        },
        {
          key: "precision",
          label: { en: "Precision", fa: "دقت واژگان" },
          score: 58,
          verdict: "acceptable",
          note: {
            en: "Wrong prepositions after nouns and verbs make some otherwise good phrases sound unnatural.",
            fa: "حرف اضافهٔ اشتباه بعد از اسم و فعل باعث می‌شود بعضی عبارت‌های خوب طبیعی به نظر نرسند.",
          },
          example: "taking photos from nature",
        },
      ],
      tips: [
        {
          en: "Learn nouns with their prepositions: 'photos of', 'on the internet', 'on weekdays'.",
          fa: "اسم‌ها را همراه با حرف اضافه‌شان یاد بگیرید: «photos of»، «on the internet»، «on weekdays».",
        },
        {
          en: "You say 'important' several times. Try 'essential', 'vital' or 'a big part of' instead.",
          fa: "چند بار «important» گفتید. به‌جایش «essential»، «vital» یا «a big part of» را امتحان کنید.",
        },
      ],
    },
    {
      key: "gra",
      band: 6,
      comment: {
        en: "You use a mix of simple and complex structures, including relative clauses, but there are frequent errors with verb patterns ('explained me', 'let me to do') and past habits.",
        fa: "ترکیبی از ساختارهای ساده و مرکب، از جمله relative clause، به کار می‌بری، ولی توی الگوهای فعلی («explained me»، «let me to do») و عادت‌های گذشته خطا زیاد داری.",
      },
      metrics: [
        {
          key: "range",
          label: { en: "Range", fa: "تنوع ساختارها" },
          score: 68,
          verdict: "good",
          note: {
            en: "You use relative clauses, conditionals and the present perfect, a wider range than most answers at this band.",
            fa: "از relative clause، جمله‌های شرطی و present perfect استفاده می‌کنی؛ تنوعی بیشتر از بیشتر جواب‌ها در این Band.",
          },
          example: "My grandmother, who lives in Isfahan, taught it to me",
        },
        {
          key: "accuracy",
          label: { en: "Accuracy", fa: "دقت دستوری" },
          score: 48,
          verdict: "needs-work",
          note: {
            en: "Verb patterns go wrong again and again, such as 'explained me' and 'let me to do'.",
            fa: "الگوی فعل‌ها بارها اشتباه می‌شود، مثل «explained me» و «let me to do».",
          },
          example: "she let me to do it myself",
        },
        {
          key: "complex-sentences",
          label: { en: "Complex sentences", fa: "جمله‌های مرکب" },
          score: 60,
          verdict: "acceptable",
          note: {
            en: "Long sentences are usually clear, but past habits come out in the past continuous instead of 'used to' or 'would'.",
            fa: "جمله‌های طولانی معمولاً روشن‌اند، ولی عادت‌های گذشته را به‌جای «used to» یا «would» با گذشتهٔ استمراری می‌گویید.",
          },
          example: "my mother was waking me up every day",
        },
      ],
      tips: [
        {
          en: "Say ten common verb patterns aloud until they feel automatic: 'explain something to someone', 'let someone do', 'make someone do'.",
          fa: "ده الگوی رایج فعلی رو بلند تکرار کن تا خودکار بشن: «explain something to someone»، «let someone do»، «make someone do».",
        },
        {
          en: "For past habits, use 'used to' or 'would': 'my mother used to wake me up'.",
          fa: "برای عادت‌های گذشته از «used to» یا «would» استفاده کن: «my mother used to wake me up».",
        },
        {
          en: "Avoid double comparatives: say 'much faster', not 'much more faster'.",
          fa: "صفت تفضیلی رو دوبار نیار: بگو «much faster»، نه «much more faster».",
        },
      ],
    },
    {
      key: "p",
      band: 6.5,
      comment: {
        en: "Generally easy to understand. A few sounds (/w/ and /θ/) and some word stress make you harder to follow, and your intonation is flat in longer answers.",
        fa: "در کل راحت فهمیده می‌شوید. چند صدا (/w/ و /θ/) و تکیهٔ بعضی کلمه‌ها فهم حرفتان را سخت‌تر می‌کند و در جواب‌های طولانی آهنگ صدایتان یکنواخت می‌شود.",
      },
      metrics: [
        {
          key: "individual-sounds",
          label: { en: "Individual sounds", fa: "تلفظ صداها" },
          score: 60,
          verdict: "acceptable",
          note: {
            en: "/w/ sometimes becomes /v/, /θ/ becomes /t/, and you add a vowel before /sk/ in 'school'.",
            fa: "صدای /w/ گاهی /v/ می‌شود، /θ/ به /t/ تبدیل می‌شود و قبل از /sk/ در «school» یک صدای «اِ» اضافه می‌کنید.",
          },
          example: "my grandparents' wedding",
        },
        {
          key: "word-stress",
          label: { en: "Word stress", fa: "تکیهٔ کلمه" },
          score: 66,
          verdict: "good",
          note: {
            en: "Most words are stressed correctly, but in longer words like 'vocabulary' the stress moves to the end.",
            fa: "تکیهٔ بیشتر کلمه‌ها درست است، ولی در کلمه‌های بلند مثل «vocabulary» تکیه به آخر کلمه می‌رود.",
          },
          example: "my vocabulary flashcards",
        },
        {
          key: "intonation",
          label: { en: "Intonation", fa: "آهنگ صدا" },
          score: 56,
          verdict: "acceptable",
          note: {
            en: "Your voice stays flat in longer answers and lists, so the key words don't stand out.",
            fa: "در جواب‌های طولانی و فهرست‌ها صدایتان یکنواخت می‌ماند و کلمه‌های مهم برجسته نمی‌شوند.",
          },
          example: "cooking, sewing, or growing plants",
        },
      ],
      tips: [
        {
          en: "Practise /w/ against /v/ with pairs like 'wet/vet' and 'west/vest', watching your lips in a mirror.",
          fa: "صدای /w/ و /v/ را با جفت‌کلمه‌هایی مثل «wet/vet» و «west/vest» جلوی آینه تمرین کنید و به لب‌هایتان دقت کنید.",
        },
        {
          en: "In lists, let your voice rise on each item and fall on the last one.",
          fa: "در فهرست‌ها صدایتان را روی هر مورد کمی بالا ببرید و روی مورد آخر پایین بیاورید.",
        },
        {
          en: "Give the most important word in each sentence a little more stress, so the listener hears what matters.",
          fa: "مهم‌ترین کلمهٔ هر جمله را کمی محکم‌تر بگویید تا شنونده بفهمد چه چیزی مهم است.",
        },
      ],
    },
  ],
  parts: [
    { part: 1, partId: "a1-s-p1", band: 7, recordingKey: null, durationSec: 238, transcript: speakingP1 },
    { part: 2, partId: "a1-s-p2", band: 6.5, recordingKey: null, durationSec: 112, transcript: speakingP2 },
    { part: 3, partId: "a1-s-p3", band: 6.5, recordingKey: null, durationSec: 262, transcript: speakingP3 },
  ],
  pronunciation: [
    {
      word: "wedding",
      note: {
        en: "You said /v/ at the start. Round your lips for /w/ and don't touch your teeth to your lip.",
        fa: "اولش ‎/v/‎ گفتی. برای ‎/w/‎ لب‌هات رو گرد کن و دندونت رو به لب نزن.",
      },
    },
    {
      word: "think",
      note: {
        en: "/θ/ sounded like /t/. Put your tongue lightly between your teeth and push air out.",
        fa: "‎/θ/‎ شبیه ‎/t/‎ شنیده شد. زبونت رو آروم بین دندون‌ها بذار و هوا رو بیرون بده.",
      },
    },
    {
      word: "vocabulary",
      note: {
        en: "Stress the second syllable: vo-CAB-u-la-ry, not vo-ca-bu-LA-ry.",
        fa: "تأکید روی هجای دومه: ‎vo-CAB-u-la-ry‎، نه ‎vo-ca-bu-LA-ry‎.",
      },
    },
    {
      word: "school",
      note: {
        en: "You added a vowel before the /sk/ cluster ('eschool'). Start directly with /s/.",
        fa: "قبل از ‎/sk/‎ یه واکه اضافه کردی («eschool»). مستقیم با ‎/s/‎ شروع کن.",
      },
    },
    {
      word: "practise",
      note: {
        en: "Stress the first syllable: PRAC-tise. The second vowel is short and weak.",
        fa: "تأکید روی هجای اوله: ‎PRAC-tise‎. واکه‌ی دوم کوتاه و ضعیفه.",
      },
    },
    {
      word: "cooking, sewing, or growing plants",
      note: {
        en: "In a list, let your voice rise on each item and fall on the last one. Your intonation stayed flat.",
        fa: "توی یه فهرست، صدات روی هر مورد بالا بره و روی آخری پایین بیاد. آهنگ صدات صاف موند.",
      },
    },
  ],
  annotations: [
    {
      quote: "especially in the weekdays",
      kind: "grammar",
      note: { en: "We say 'on weekdays', with no article.", fa: "می‌گیم «on weekdays»، بدون article." },
      fix: "especially on weekdays",
    },
    {
      quote: "my mother was waking me up every day",
      kind: "grammar",
      note: {
        en: "For a past habit, use 'used to' or 'would', not the past continuous.",
        fa: "برای عادت گذشته از «used to» یا «would» استفاده کن، نه past continuous.",
      },
      fix: "my mother used to wake me up every day",
    },
    {
      quote: "taking photos from nature",
      kind: "vocabulary",
      note: { en: "You take photos of something.", fa: "عکس گرفتن از چیزی با «of» میاد: «take photos of»." },
      fix: "taking photos of nature",
    },
    {
      quote: "she explained me every step",
      kind: "grammar",
      note: {
        en: "'Explain' needs 'to' before the person.",
        fa: "«Explain» قبل از شخص «to» لازم داره.",
      },
      fix: "she explained every step to me",
    },
    {
      quote: "she let me to do it myself",
      kind: "grammar",
      note: { en: "'Let' is followed by the base verb without 'to'.", fa: "بعد از «Let» فعل ساده بدون «to» میاد." },
      fix: "she let me do it myself",
    },
    {
      quote: "much more faster",
      kind: "grammar",
      note: { en: "Double comparative.", fa: "صفت تفضیلی دوتایی." },
      fix: "much faster",
    },
  ],
  summary: {
    en: "You speak fluently and develop your answers well, which is why Fluency and Coherence is your strongest score. Grammar holds the band at 6.5: verb patterns like 'explain to' and 'let someone do' come up again and again. Practise ten of these patterns aloud this week.",
    fa: "روان صحبت می‌کنی و جواب‌هات رو خوب گسترش می‌دی، برای همین Fluency and coherence قوی‌ترین نمره‌ته. گرامر Band رو روی ۶٫۵ نگه داشته: الگوهای فعلی مثل «explain to» و «let someone do» مدام تکرار می‌شن. این هفته ده‌تا از این الگوها رو بلند تمرین کن.",
  },
  dummy: true,
};

/* ------------------------------------------------------------------ */
/*  Earlier speaking results (seeded past mocks)                       */
/* ------------------------------------------------------------------ */

const olderSpeaking1 = {
  p1: `I'm studying civil engineering at university. I chose it because my father is engineer and I always liked building things.
My hometown is Shiraz. It is famous for its gardens and poets, and the weather is nice in the spring.
I think the best thing is the people. They are very friendly and they always invite you to their home.`,
  p2: `I want to talk about a trip to Kish Island with my family two years ago. We went there by plane and stayed for five days. We was swimming in the sea every day and we visit the old Greek ship. The reason I remember this trip is because it was the first time my whole family was together after my brother go to Canada.`,
  p3: `I think people travel more than past because flights are more easy to find online. But in my country the travel is expensive for many families, so they travel inside the country. Travelling is useful for young people because they learn about different cultures and they become more open-minded.`,
};

const olderSpeaking2 = {
  p1: `I live in an apartment with my parents in Karaj. It is not very big, but it has a nice balcony with many plants.
I usually spend my evenings with reading novels or watching series. Recently I watched a Korean series and it was very interesting.
Not really, I don't cook much. My mother is a very good cook, so I just help her sometimes.`,
  p2: `I'd like to describe a website I use very often, which is a dictionary website. I use it almost every day for my English study. It shows the meaning, the pronunciation and many examples sentence. I found it when I was preparing for my university exam. I like it because it is very simple and it don't have many advertisements, so I can concentrate.`,
  p3: `I think the internet changed the way people learn completely. In the past students must go to the library, but now everything is in their phone. However, there is a lot of wrong information online, so students should learn how to check the source. Teachers are still important because they can motivate students.`,
};

const olderSpeaking3 = {
  p1: `I work part-time in a bookshop near my university. I've been working there for about a year, and I really enjoy it because I can read new books before everybody.
Yes, I like reading a lot, mostly history books and sometimes poetry.
I usually read before bed, maybe thirty minutes, because it helps me to relax after a long day.`,
  p2: `I'm going to talk about my high school chemistry teacher, Mr Rahimi. He was quite strict, but he had a very creative way of teaching. For example, he brought simple experiments to the class, so we could see the reactions with our own eyes. Before his class I hated chemistry, but he made me realise that science is actually about curiosity. That's why I decided to study a science subject at university.`,
  p3: `In my opinion, a good teacher should be patient and passionate about the subject. Students can feel if a teacher really loves what he teaches. Nowadays, teachers have to compete with phones and social media for students' attention, so their job is much harder than before. I think the government should pay more attention to teacher training.`,
};

export const speakingFeedbackOlder: SpeakingFeedback[] = [
  {
    band: 6,
    criteria: [
      {
        key: "fc",
        band: 6,
        comment: {
          en: "You keep talking and answer every question, but Part 2 ends early and some answers are short.",
          fa: "صحبت را ادامه می‌دهید و به همه سؤال‌ها جواب می‌دهید، ولی بخش دوم زود تمام شد و بعضی جواب‌ها کوتاه‌اند.",
        },
      },
      {
        key: "lr",
        band: 6,
        comment: {
          en: "Enough vocabulary for familiar topics, with a good phrase like 'open-minded'. Comparisons are often wrong ('more easy').",
          fa: "برای موضوع‌های آشنا واژگان کافی دارید و عبارت خوبی مثل «open-minded» به کار بردید. مقایسه‌ها اغلب اشتباه‌اند («more easy»).",
        },
      },
      {
        key: "gra",
        band: 5.5,
        comment: {
          en: "Past tense errors are frequent in Part 2 ('we was', 'we visit', 'my brother go').",
          fa: "در بخش دوم خطای زمان گذشته زیاد است («we was»، «we visit»، «my brother go»).",
        },
      },
      {
        key: "p",
        band: 6,
        comment: {
          en: "Generally clear, though word stress on longer words sometimes slips.",
          fa: "در کل واضح است، ولی تکیهٔ کلمه‌های بلند گاهی جابه‌جا می‌شود.",
        },
      },
    ],
    parts: [
      { part: 1, partId: "a1-s-p1", band: 6.5, recordingKey: null, durationSec: 205, transcript: olderSpeaking1.p1 },
      { part: 2, partId: "a1-s-p2", band: 5.5, recordingKey: null, durationSec: 74, transcript: olderSpeaking1.p2 },
      { part: 3, partId: "a1-s-p3", band: 6, recordingKey: null, durationSec: 210, transcript: olderSpeaking1.p3 },
    ],
    pronunciation: [
      { word: "engineering", note: { en: "Stress the last syllable: en-gi-NEER-ing.", fa: "تکیه روی بخش سوم است: en-gi-NEER-ing." } },
      { word: "with", note: { en: "Start with /w/, not /v/.", fa: "کلمه را با /w/ شروع کنید، نه /v/." } },
      { word: "spring", note: { en: "No vowel before /spr/ ('espring').", fa: "قبل از /spr/ صدای «اِ» اضافه نکنید («espring»)." } },
      { word: "three", note: { en: "/θ/ sounded like /t/.", fa: "صدای /θ/ شبیه /t/ شد." } },
    ],
    annotations: [
      { quote: "my father is engineer", kind: "grammar", note: { en: "Jobs need 'a' or 'an'.", fa: "قبل از اسم شغل «a» یا «an» لازم است." }, fix: "my father is an engineer" },
      { quote: "We was swimming in the sea every day and we visit", kind: "grammar", note: { en: "'We were', and keep the past tense for 'visited'.", fa: "«We were» درست است و «visited» هم باید گذشته باشد." }, fix: "We swam in the sea every day and we visited" },
      { quote: "after my brother go to Canada", kind: "grammar", note: { en: "Past event, so 'went'.", fa: "اتفاق در گذشته است، پس «went»." }, fix: "after my brother went to Canada" },
      { quote: "more easy", kind: "vocabulary", note: { en: "Short adjectives take -er.", fa: "صفت‌های کوتاه با «er» مقایسه می‌شوند." }, fix: "easier" },
    ],
    summary: {
      en: "You can talk about familiar topics comfortably, but Part 2 was too short and past tenses were often wrong. Practise telling a two-minute story in the past.",
      fa: "دربارهٔ موضوع‌های آشنا راحت حرف می‌زنید، ولی بخش دوم خیلی کوتاه بود و زمان گذشته اغلب اشتباه بود. تعریف کردن یک داستان دو دقیقه‌ای در زمان گذشته را تمرین کنید.",
    },
    dummy: true,
  },
  {
    band: 6,
    criteria: [
      {
        key: "fc",
        band: 6.5,
        comment: {
          en: "You speak willingly and link ideas with 'so', 'because' and 'however'. Some hesitation when looking for words in Part 3.",
          fa: "با میل صحبت می‌کنید و ایده‌ها را با «so»، «because» و «however» به هم وصل می‌کنید. در بخش سوم موقع پیدا کردن کلمه کمی مکث دارید.",
        },
      },
      {
        key: "lr",
        band: 6,
        comment: {
          en: "Adequate range with some good items ('check the source', 'motivate'). A few collocation errors.",
          fa: "دامنهٔ واژگان کافی است و چند مورد خوب دارید («check the source»، «motivate»). چند خطای همایندی هم هست.",
        },
      },
      {
        key: "gra",
        band: 5.5,
        comment: {
          en: "Agreement and modal errors ('it don't', 'students must go' for the past).",
          fa: "خطای مطابقت و فعل‌های کمکی دارید («it don't» و «students must go» برای گذشته).",
        },
      },
      {
        key: "p",
        band: 6,
        comment: {
          en: "Clear overall, but intonation is flat and some vowels are shortened.",
          fa: "در کل واضح است، ولی آهنگ صدا یکنواخت است و بعضی مصوت‌ها کوتاه ادا می‌شوند.",
        },
      },
    ],
    parts: [
      { part: 1, partId: "a1-s-p1", band: 6.5, recordingKey: null, durationSec: 214, transcript: olderSpeaking2.p1 },
      { part: 2, partId: "a1-s-p2", band: 6, recordingKey: null, durationSec: 88, transcript: olderSpeaking2.p2 },
      { part: 3, partId: "a1-s-p3", band: 6, recordingKey: null, durationSec: 230, transcript: olderSpeaking2.p3 },
    ],
    pronunciation: [
      { word: "advertisements", note: { en: "British stress: ad-VER-tise-ments.", fa: "تکیه در انگلیسی بریتانیایی روی بخش دوم است: ad-VER-tise-ments." } },
      { word: "website", note: { en: "Start with /w/, not /v/.", fa: "کلمه را با /w/ شروع کنید، نه /v/." } },
      { word: "study", note: { en: "No vowel before /st/ ('estudy').", fa: "قبل از /st/ صدای «اِ» اضافه نکنید («estudy»)." } },
      { word: "interesting", note: { en: "Three syllables: IN-tres-ting. Don't stress the 'rest'.", fa: "سه بخش دارد: IN-tres-ting. تکیه را روی «rest» نگذارید." } },
    ],
    annotations: [
      { quote: "spend my evenings with reading novels", kind: "grammar", note: { en: "'Spend time' + -ing, without 'with'.", fa: "بعد از «spend time» فعل با «ing» می‌آید و «with» لازم نیست." }, fix: "spend my evenings reading novels" },
      { quote: "many examples sentence", kind: "grammar", note: { en: "The plural goes on the second noun.", fa: "علامت جمع روی اسم دوم می‌آید." }, fix: "many example sentences" },
      { quote: "it don't have", kind: "grammar", note: { en: "'It' takes 'doesn't'.", fa: "با «it» باید «doesn't» بیاید." }, fix: "it doesn't have" },
      { quote: "students must go to the library", kind: "grammar", note: { en: "For past obligation, use 'had to'.", fa: "برای اجبار در گذشته از «had to» استفاده کنید." }, fix: "students had to go to the library" },
    ],
    summary: {
      en: "Good fluency and clear ideas, but agreement errors and flat intonation hold the band at 6.0. Record yourself and listen for 'it doesn't' and rising tones on questions.",
      fa: "روانی خوبی دارید و ایده‌هایتان روشن است، ولی خطای مطابقت و آهنگ یکنواخت صدا نمره را روی ۶ نگه داشته است. صدایتان را ضبط کنید و به «it doesn't» و بالا رفتن صدا در سؤال‌ها دقت کنید.",
    },
    dummy: true,
  },
  {
    band: 6.5,
    criteria: [
      {
        key: "fc",
        band: 6.5,
        comment: {
          en: "Answers are well developed and Part 2 covers every point. Occasional repetition of 'I think'.",
          fa: "جواب‌ها خوب گسترش یافته‌اند و بخش دوم همهٔ نکته‌ها را پوشش می‌دهد. گاهی «I think» تکرار می‌شود.",
        },
      },
      {
        key: "lr",
        band: 6.5,
        comment: {
          en: "Good less common items ('passionate about', 'curiosity', 'with our own eyes'). One or two unnatural phrases.",
          fa: "واژه‌های کمتر رایج خوبی به کار بردید («passionate about»، «curiosity»، «with our own eyes»). یکی دو عبارت طبیعی نیست.",
        },
      },
      {
        key: "gra",
        band: 6,
        comment: {
          en: "Good use of the present perfect continuous and relative clauses, with a few verb-pattern errors.",
          fa: "حال کامل استمراری و جمله‌های موصولی را خوب به کار بردید، با چند خطای کوچک در الگوی فعل.",
        },
      },
      {
        key: "p",
        band: 6.5,
        comment: {
          en: "Easy to understand, with better sentence stress than before. /θ/ is still unstable.",
          fa: "راحت فهمیده می‌شوید و تکیهٔ جمله از قبل بهتر شده است. صدای /θ/ هنوز ثابت نیست.",
        },
      },
    ],
    parts: [
      { part: 1, partId: "a1-s-p1", band: 6.5, recordingKey: null, durationSec: 226, transcript: olderSpeaking3.p1 },
      { part: 2, partId: "a1-s-p2", band: 7, recordingKey: null, durationSec: 104, transcript: olderSpeaking3.p2 },
      { part: 3, partId: "a1-s-p3", band: 6.5, recordingKey: null, durationSec: 248, transcript: olderSpeaking3.p3 },
    ],
    pronunciation: [
      { word: "chemistry", note: { en: "Starts with /k/, and stress the first syllable: KEM-is-try.", fa: "با صدای /k/ شروع می‌شود و تکیه روی بخش اول است: KEM-is-try." } },
      { word: "thirty", note: { en: "/θ/ sounded like /s/.", fa: "صدای /θ/ شبیه /s/ شد." } },
      { word: "strict", note: { en: "No vowel before /str/ ('estrict').", fa: "قبل از /str/ صدای «اِ» اضافه نکنید («estrict»)." } },
      { word: "curiosity", note: { en: "Stress: cu-ri-OS-i-ty.", fa: "تکیه روی بخش سوم است: cu-ri-OS-i-ty." } },
    ],
    annotations: [
      { quote: "before everybody", kind: "vocabulary", note: { en: "'Before anyone else' is the natural phrase here.", fa: "عبارت طبیعی اینجا «before anyone else» است." }, fix: "before anyone else" },
      { quote: "it helps me to relax", kind: "grammar", note: { en: "Correct, but 'helps me relax' is more natural in speech.", fa: "درست است، ولی در گفتار «helps me relax» طبیعی‌تر است." }, fix: "it helps me relax" },
      { quote: "what he teaches", kind: "grammar", note: { en: "Use 'they' for a person in general.", fa: "برای اشارهٔ کلی به یک شخص از «they» استفاده کنید." }, fix: "what they teach" },
      { quote: "much harder than before", kind: "vocabulary", note: { en: "Good comparison, used accurately.", fa: "مقایسهٔ خوب و درستی است." } },
    ],
    summary: {
      en: "A clear step up: your answers are longer and better organised. Grammar is now the main thing to fix, especially verb patterns and pronouns.",
      fa: "پیشرفت روشنی داشته‌اید: جواب‌ها بلندتر و منظم‌ترند. حالا مهم‌ترین چیزی که باید درست کنید دستور زبان است، مخصوصاً الگوی فعل‌ها و ضمیرها.",
    },
    dummy: true,
  },
];
