import type { Part, Section } from "@/api/schemas";

/*
 * Academic mock 1: Reading.
 * Original dummy content written for the prototype. Not taken from any published IELTS material.
 * Part 1 diagram (Questions 12–13) is drawn from readingFigures["r1-diagram"] in reading-figures.ts.
 * Diagram item `position` = top-left corner of the answer box, in percent of the figure box
 * (each blank area on the SVG is about 20% wide and 10% tall).
 */

const tfng = [
  { key: "TRUE", text: "TRUE" },
  { key: "FALSE", text: "FALSE" },
  { key: "NOT GIVEN", text: "NOT GIVEN" },
];

const ynng = [
  { key: "YES", text: "YES" },
  { key: "NO", text: "NO" },
  { key: "NOT GIVEN", text: "NOT GIVEN" },
];

/* ------------------------------------------------------------------ */
/*  Part 1: Salt from the Sun                                          */
/* ------------------------------------------------------------------ */

const p1: Part = {
  id: "a1-r-p1",
  number: 1,
  rubric: "Read the text and answer questions 1–13.",
  passage: {
    title: "Salt from the Sun",
    subtitle: "How coastal communities learned to farm one of the world's oldest commodities",
    paragraphs: [
      {
        text: "For most of human history, salt was far more than a seasoning. Before refrigeration, it was the principal means of preserving meat and fish through the winter, and armies, fishing fleets and growing towns all depended on a steady supply. Governments recognised its value early: salt was taxed in China more than two thousand years ago, and in parts of medieval Europe the right to sell it was controlled by the crown. Yet the methods used to obtain this essential mineral varied enormously from place to place, and each brought its own difficulties.",
      },
      {
        text: "Inland communities often relied on rock salt, the remains of ancient seas that had dried out millions of years earlier and been buried beneath later layers of rock. Extracting it meant digging deep shafts, and the work was slow and dangerous; underground chambers could flood without warning when miners broke into pockets of groundwater. Where natural springs brought salty water to the surface, a second method was possible. The brine was poured into large metal pans and boiled until only the salt remained. This produced a fine, white product, but it consumed enormous quantities of fuel. Historians have linked the disappearance of several woodlands in northern Europe to the demands of salt boilers, and when wood became scarce, some works switched to peat, which burned less efficiently.",
      },
      {
        text: "Along warm coasts, a third approach made use of two resources that cost nothing: seawater and sunshine. Solar salt making is at least as old as the boiling method; there is evidence of it on the shores of the Mediterranean in the classical period, and similar works developed independently in parts of Asia and West Africa. The principle is simple. Seawater contains roughly 3.5 per cent dissolved salts, and if it is left in shallow ponds under a hot sun and a steady breeze, the water gradually evaporates and the salt is left behind. In practice, however, producing salt of good quality in this way requires considerable skill.",
      },
      {
        text: "A traditional saltworks is built on flat land just above the high-tide line. At high tide, seawater is admitted through a sluice, a wooden gate that the salt workers can open and close by hand. The water then flows slowly through a chain of large, shallow basins known as concentrating ponds. As it moves from one pond to the next, the water loses volume and the brine becomes steadily denser. This stage is not merely a matter of waiting. Seawater contains other minerals besides common salt, and the first of these to separate out, a chalky substance called gypsum, must be allowed to settle on the floor of the concentrating ponds; if it reached the final stage it would spoil the colour and taste of the finished product.",
      },
      {
        text: "Moving the brine uphill or between ponds at different levels was once done with buckets or with pumps turned by animals. From the eighteenth century onwards, many works on the Atlantic coast of Europe adopted small windmills for the task, and in some regions these became so common that they are still associated with the landscape today. Once the brine is close to saturation, it is transferred to the crystallising pans. These are much smaller than the concentrating ponds and have floors of carefully levelled clay, which is beaten flat each spring so that the salt can be raked without picking up mud. Within a few days of hot weather, a layer of crystals forms on the surface and sinks to the bottom.",
      },
      {
        text: "The harvest is the most labour-intensive part of the process. Workers draw the salt to the edge of each pan with long wooden rakes, taking care not to disturb the clay beneath. The wet salt is then piled into heaps beside the pans, where it is left to drain for several weeks; rainwater and remaining brine run off, carrying away some of the bitter-tasting minerals and leaving a purer product. In a good season, a single pan might be harvested every two or three days. A sudden summer storm, however, could undo weeks of work, because rain dilutes the brine and dissolves salt that has not yet been collected. For this reason solar works have always been confined to regions with long, dry summers.",
      },
      {
        text: "The finest crystals form as a thin crust on the surface of the brine during calm, warm evenings. In France this delicate product is known as fleur de sel, and because it must be skimmed by hand before it sinks, only small quantities can be gathered. Traditionally it was kept by the workers for their own use or sold locally; today it is exported worldwide and can cost many times more than ordinary salt.",
      },
      {
        text: "The industrial age brought both decline and renewal. Cheap rock salt, extracted by modern machinery and transported by rail, drove many small coastal works out of business in the late nineteenth century. Some survived only because their owners turned them into visitor attractions. Others, however, were enlarged and mechanised, and solar evaporation now accounts for around a third of the world's salt output. Large modern works in Australia and Mexico cover tens of thousands of hectares, and the salt is collected by heavy vehicles rather than rakes. The basic principle, though, has hardly changed in two thousand years.",
      },
    ],
  },
  groups: [
    {
      id: "a1-r-g1",
      type: "tfng",
      interaction: "single",
      title: "Questions 1–5",
      instructions:
        "Do the following statements agree with the information given in the text?\n\nChoose **TRUE** if the statement agrees with the information\nChoose **FALSE** if the statement contradicts the information\nChoose **NOT GIVEN** if there is no information on this",
      items: [
        {
          id: "a1-r-q1",
          numbers: [1],
          prompt: "Rock salt comes from seas that dried up a very long time ago.",
          options: tfng,
          answer: ["TRUE"],
          explanation: {
            en: "The text calls rock salt 'the remains of ancient seas that had dried out millions of years earlier'. 'A very long time ago' is a paraphrase of 'millions of years earlier'.",
            fa: "متن می‌گوید rock salt «باقی‌ماندهٔ دریاهای باستانی» است که «millions of years earlier» خشک شده‌اند. عبارت «a very long time ago» همین معنا را با کلمات دیگر می‌گوید، پس جواب TRUE است.",
          },
          trap: { en: "Paraphrase", fa: "بیان دیگر" },
          evidence:
            "Inland communities often relied on rock salt, the remains of ancient seas that had dried out millions of years earlier and been buried beneath later layers of rock.",
        },
        {
          id: "a1-r-q2",
          numbers: [2],
          prompt: "Salt produced using peat as fuel was of higher quality than salt produced using wood.",
          options: tfng,
          answer: ["NOT GIVEN"],
          explanation: {
            en: "The text only says that peat 'burned less efficiently' than wood. It says nothing about the quality of the salt made with either fuel.",
            fa: "متن فقط می‌گوید peat «burned less efficiently»، یعنی به‌خوبیِ چوب نمی‌سوخت. دربارهٔ کیفیت نمکی که با هر کدام از این سوخت‌ها تولید می‌شد چیزی گفته نشده، پس جواب NOT GIVEN است.",
          },
          trap: {
            en: "Related detail, different claim: peat is compared with wood, but only for how well it burns",
            fa: "جزئیات مرتبط ولی ادعای متفاوت: peat با چوب مقایسه شده، اما فقط از نظر سوختن، نه کیفیت نمک",
          },
          evidence: "when wood became scarce, some works switched to peat, which burned less efficiently.",
        },
        {
          id: "a1-r-q3",
          numbers: [3],
          prompt: "Solar salt making was developed later than the method of boiling brine.",
          options: tfng,
          answer: ["FALSE"],
          explanation: {
            en: "The text says solar salt making 'is at least as old as the boiling method', so it did not come later.",
            fa: "متن می‌گوید روش خورشیدی «at least as old as the boiling method» است، یعنی دست‌کم به اندازهٔ روش جوشاندن قدمت دارد. پس دیرتر به وجود نیامده و جملهٔ سؤال با متن مخالف است: FALSE.",
          },
          trap: {
            en: "Comparison words: 'at least as old as' means not newer",
            fa: "عبارت مقایسه‌ای: «at least as old as» یعنی جدیدتر نیست",
          },
          evidence: "Solar salt making is at least as old as the boiling method;",
        },
        {
          id: "a1-r-q4",
          numbers: [4],
          prompt: "The floors of the crystallising pans are made level once a year.",
          options: tfng,
          answer: ["TRUE"],
          explanation: {
            en: "The pan floors are 'beaten flat each spring', which means they are levelled once every year.",
            fa: "متن می‌گوید کف این حوضچه‌ها «beaten flat each spring» می‌شود، یعنی هر بهار صاف می‌شود. «each spring» یعنی سالی یک بار، پس جواب TRUE است.",
          },
          trap: { en: "Paraphrase: 'each spring' = once a year", fa: "بیان دیگر: «each spring» یعنی سالی یک بار" },
          evidence:
            "These are much smaller than the concentrating ponds and have floors of carefully levelled clay, which is beaten flat each spring so that the salt can be raked without picking up mud.",
        },
        {
          id: "a1-r-q5",
          numbers: [5],
          prompt: "Fleur de sel was originally produced mainly for sale abroad.",
          options: tfng,
          answer: ["FALSE"],
          explanation: {
            en: "Traditionally, fleur de sel was kept by the workers or sold locally. It is exported only today, so the statement contradicts the text.",
            fa: "در گذشته fleur de sel را خود کارگران مصرف می‌کردند یا در همان محل می‌فروختند. صادرات آن مربوط به امروز است، نه گذشته. پس جمله با متن مخالف است: FALSE.",
          },
          trap: {
            en: "Time switch: 'exported worldwide' is true today, not originally",
            fa: "جابه‌جایی زمان: «exported worldwide» دربارهٔ امروز است، نه گذشته",
          },
          evidence: "Traditionally it was kept by the workers for their own use or sold locally;",
        },
      ],
    },
    {
      id: "a1-r-g2",
      type: "table-completion",
      interaction: "gap",
      title: "Questions 6–8",
      instructions: "Complete the table.\n\nChoose **ONE WORD ONLY** from the passage for each answer.",
      content: [
        {
          kind: "table",
          header: ["Method", "Where it was used", "Main difficulty"],
          rows: [
            ["Mining rock salt", "inland areas", "underground chambers could flood if miners reached pockets of {{6}}"],
            ["Boiling brine", "near natural springs", "needed enormous amounts of {{7}}, such as wood or peat"],
            ["Solar evaporation", "warm coasts", "weeks of work could be lost in a sudden {{8}}"],
          ],
        },
      ],
      items: [
        {
          id: "a1-r-q6",
          numbers: [6],
          answer: ["groundwater"],
          explanation: {
            en: "Chambers could flood 'when miners broke into pockets of groundwater'.",
            fa: "متن می‌گوید اتاقک‌های زیرزمینی وقتی آب می‌گرفتند که معدنچی‌ها به «pockets of groundwater» می‌رسیدند. پس جواب groundwater است.",
          },
          evidence:
            "underground chambers could flood without warning when miners broke into pockets of groundwater.",
        },
        {
          id: "a1-r-q7",
          numbers: [7],
          answer: ["fuel"],
          explanation: {
            en: "Boiling brine 'consumed enormous quantities of fuel'. Wood and peat are examples of that fuel, so the general word is needed.",
            fa: "متن می‌گوید جوشاندن آب‌نمک «enormous quantities of fuel» مصرف می‌کرد. چوب و peat نمونه‌های همین سوخت هستند، پس کلمهٔ کلی fuel لازم است.",
          },
          trap: {
            en: "Example vs category: 'wood' is one example, not the general word the table needs",
            fa: "نمونه به‌جای کلمهٔ کلی: «wood» فقط یک نمونه است؛ جدول کلمهٔ کلی را می‌خواهد",
          },
          evidence: "This produced a fine, white product, but it consumed enormous quantities of fuel.",
        },
        {
          id: "a1-r-q8",
          numbers: [8],
          answer: ["storm"],
          explanation: {
            en: "'A sudden summer storm' could 'undo weeks of work', which matches 'weeks of work could be lost'.",
            fa: "متن می‌گوید «a sudden summer storm» می‌توانست زحمت چند هفته را از بین ببرد. این همان «weeks of work could be lost» در جدول است، پس جواب storm است.",
          },
          trap: {
            en: "Word choice: 'rain' appears nearby, but 'a sudden ___' needs 'storm'",
            fa: "انتخاب کلمه: «rain» هم نزدیک آن آمده، اما بعد از «a sudden» کلمهٔ storm درست است",
          },
          evidence:
            "A sudden summer storm, however, could undo weeks of work, because rain dilutes the brine and dissolves salt that has not yet been collected.",
        },
      ],
    },
    {
      id: "a1-r-g3",
      type: "flow-chart-completion",
      interaction: "gap",
      title: "Questions 9–11",
      instructions: "Complete the flow chart.\n\nChoose **ONE WORD ONLY** from the passage for each answer.",
      content: [
        {
          kind: "flow",
          steps: [
            "At high tide, seawater is let in through a {{9}} that is opened by hand",
            "The water moves slowly through the concentrating ponds, and {{10}} settles on their floors",
            "The brine, now close to saturation, is moved into the crystallising pans",
            "Workers rake the salt crystals to the edge of each pan",
            "The salt is piled into heaps and left for several weeks to {{11}}",
          ],
        },
      ],
      items: [
        {
          id: "a1-r-q9",
          numbers: [9],
          answer: ["sluice"],
          explanation: {
            en: "Seawater 'is admitted through a sluice, a wooden gate that the salt workers can open and close by hand'.",
            fa: "متن می‌گوید آب دریا از طریق یک sluice وارد می‌شود؛ دریچه‌ای چوبی که کارگرها با دست باز و بسته می‌کنند.",
          },
          trap: {
            en: "Word limit: 'wooden gate' is two words; the one-word answer is 'sluice'",
            fa: "محدودیت کلمه: «wooden gate» دو کلمه است؛ جواب یک‌کلمه‌ای sluice است",
          },
          evidence:
            "At high tide, seawater is admitted through a sluice, a wooden gate that the salt workers can open and close by hand.",
        },
        {
          id: "a1-r-q10",
          numbers: [10],
          answer: ["gypsum"],
          explanation: {
            en: "Gypsum 'must be allowed to settle on the floor of the concentrating ponds'.",
            fa: "طبق متن، gypsum باید در کف حوضچه‌های تغلیظ (concentrating ponds) ته‌نشین شود تا به مرحلهٔ آخر نرسد.",
          },
          trap: {
            en: "Wrong word nearby: 'minerals' and 'salt' are close by, but only gypsum settles in these ponds",
            fa: "کلمهٔ گمراه‌کننده در نزدیکی: «minerals» و «salt» هم آمده‌اند، اما فقط gypsum در این حوضچه‌ها ته‌نشین می‌شود",
          },
          evidence:
            "Seawater contains other minerals besides common salt, and the first of these to separate out, a chalky substance called gypsum, must be allowed to settle on the floor of the concentrating ponds;",
        },
        {
          id: "a1-r-q11",
          numbers: [11],
          answer: ["drain"],
          explanation: {
            en: "The wet salt is piled into heaps 'where it is left to drain for several weeks'.",
            fa: "متن می‌گوید نمک خیس را کپه می‌کنند و چند هفته رها می‌کنند تا آبش برود: «left to drain for several weeks». پس جواب drain است.",
          },
          evidence:
            "The wet salt is then piled into heaps beside the pans, where it is left to drain for several weeks;",
        },
      ],
    },
    {
      id: "a1-r-g4",
      type: "diagram-label-completion",
      interaction: "diagram",
      title: "Questions 12–13",
      instructions: "Label the diagram below.\n\nChoose **ONE WORD ONLY** from the passage for each answer.",
      figure: "r1-diagram",
      items: [
        {
          id: "a1-r-q12",
          numbers: [12],
          position: { x: 70, y: 12.5 },
          answer: ["windmill", "windmills"],
          explanation: {
            en: "Brine was moved between ponds at different levels, and from the eighteenth century many works 'adopted small windmills for the task'.",
            fa: "آب‌نمک را باید بین حوضچه‌هایی با ارتفاع متفاوت جابه‌جا می‌کردند. متن می‌گوید از قرن هجدهم بسیاری از نمک‌زارها برای این کار از windmill استفاده کردند.",
          },
          trap: {
            en: "Older methods: 'buckets' and 'pumps turned by animals' were used before windmills",
            fa: "روش‌های قدیمی‌تر: «buckets» و «pumps turned by animals» قبل از windmill به کار می‌رفتند",
          },
          evidence:
            "From the eighteenth century onwards, many works on the Atlantic coast of Europe adopted small windmills for the task, and in some regions these became so common that they are still associated with the landscape today.",
        },
        {
          id: "a1-r-q13",
          numbers: [13],
          position: { x: 72, y: 82 },
          answer: ["clay"],
          explanation: {
            en: "The crystallising pans 'have floors of carefully levelled clay'.",
            fa: "متن می‌گوید کف حوضچه‌های تبلور (crystallising pans) از clay ساخته شده که با دقت صاف می‌شود.",
          },
          trap: {
            en: "Wrong word nearby: 'mud' is what the clay floor prevents, not the floor itself",
            fa: "کلمهٔ گمراه‌کننده: «mud» چیزی است که کف clay جلویش را می‌گیرد، نه خود کف",
          },
          evidence:
            "These are much smaller than the concentrating ponds and have floors of carefully levelled clay, which is beaten flat each spring so that the salt can be raked without picking up mud.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Part 2: Singing over the Traffic                                   */
/* ------------------------------------------------------------------ */

const sectionLetters = ["A", "B", "C", "D", "E", "F", "G"].map((l) => ({ key: l, text: l }));

const p2: Part = {
  id: "a1-r-p2",
  number: 2,
  rubric: "Read the text and answer questions 14–26.",
  passage: {
    title: "Singing over the Traffic",
    subtitle: "City birds are changing their songs, and the change may come at a cost",
    paragraphs: [
      {
        label: "A",
        text: "In the early 2000s, ecologists recording birdsong in a large European city noticed something odd about the great tits that lived beside busy roads. Their songs were recognisably those of great tits, but they were pitched noticeably higher than the songs of birds in the woods just outside the city. At first the researchers suspected a fault in their microphones. When the same pattern appeared in recordings from several other cities, however, it became clear that they had found a genuine difference, and the question of why urban birds sing as they do has occupied researchers ever since.",
      },
      {
        label: "B",
        slot: 14,
        text: "The explanation most often proposed concerns the physics of sound. Traffic produces a great deal of low-frequency noise: the deep rumble of engines and tyres travels a long way and passes easily through walls and vegetation. A bird whose song occupies the same low range finds its message partly or completely masked, much as a voice is lost in a crowded restaurant. Higher notes, by contrast, sit above most of the traffic noise and remain audible over greater distances. A song that is shifted upwards by even a few hundred hertz may therefore reach a rival or a potential mate that would otherwise never hear it.",
      },
      {
        label: "C",
        slot: 15,
        text: "Raising the pitch is only one of the strategies that city birds appear to use. Many species simply sing more loudly in noisy surroundings, an adjustment that costs them extra energy. Others change the timing of their song. In several British cities, robins have been recorded singing for long periods during the night, when the roads are quieter, and some studies suggest that daytime noise predicts this behaviour better than the artificial light from street lamps, which was originally blamed. Still other species begin their dawn chorus earlier than their rural relatives, finishing before the morning rush hour starts.",
      },
      {
        label: "D",
        slot: 16,
        text: "What remains unclear is how these changes come about. One possibility is that urban populations have evolved, over many generations, to produce higher songs. Another is that individual birds learn to adjust their singing within their own lifetimes, either by copying the older birds around them or by responding directly to the noise they hear. Laboratory experiments have produced mixed results. In one, young birds that were reared in soundproof rooms and exposed only to recordings of traffic developed songs slightly higher than those of birds raised in silence, suggesting that at least some of the flexibility is learned. Yet the differences were smaller than those found in the wild, and most researchers now believe that both processes are involved.",
      },
      {
        label: "E",
        slot: 17,
        text: "Whatever its origin, a higher song may come at a price. In many songbirds, the depth of a male's song is linked to his body size, since larger birds tend to have larger vocal organs and can therefore produce lower notes. Females of several species respond more strongly to lower songs, apparently treating them as a sign of a healthy, well-grown partner. A male that raises his pitch to be heard over the traffic may therefore be heard more often but judged less attractive. Field studies have found that, in noisy territories, males singing at higher frequencies were somewhat less likely to keep their partners throughout the breeding season, although the effect has not been found in every species studied.",
      },
      {
        label: "F",
        slot: 18,
        text: "Studying these questions on a large scale has proved difficult. Much of the early evidence came from a handful of cities, most of them in northern Europe, and it was hard to know whether the findings applied elsewhere. Recordings were also made with microphones of varying sensitivity, which made it risky to compare the results of one study with those of another. In recent years, a partial solution has emerged from an unexpected source. Thousands of amateur birdwatchers now upload recordings to shared online collections, each labelled with a date and a location. Although the quality of individual recordings varies, the sheer number available allows researchers to compare songs from hundreds of towns and the countryside around them, and early analyses have largely confirmed the original findings.",
      },
      {
        label: "G",
        text: "These findings have practical implications. If noise prevents birds from communicating, it may reduce their breeding success and, over time, the variety of species able to live in towns. Some researchers argue that quieter road surfaces, lower speed limits in residential areas and belts of dense planting along major routes could all help. Unexpected support for this view came during the periods of restricted travel in 2020, when traffic in many cities fell sharply. Recordings made at that time showed some species singing more softly and at lower pitches, which suggests that birds can respond quickly when their surroundings become quieter.",
      },
    ],
  },
  groups: [
    {
      id: "a1-r-g5",
      type: "matching-headings",
      interaction: "drag",
      title: "Questions 14–18",
      instructions:
        "The text has seven sections, **A–G**. Choose the correct heading for sections **B–F** and move it into the gap.",
      optionsTitle: "List of Headings",
      options: [
        { key: "i", text: "Uncertainty about how the change develops" },
        { key: "ii", text: "The effect of street lighting on nesting birds" },
        { key: "iii", text: "A possible disadvantage of being easier to hear" },
        { key: "iv", text: "Why rural birds sing more often than urban ones" },
        { key: "v", text: "Why low sounds are more easily drowned out" },
        { key: "vi", text: "A new source of evidence overcomes earlier limitations" },
        { key: "vii", text: "Evidence that city birds are growing larger" },
        { key: "viii", text: "Several different ways of making a song heard" },
      ],
      items: [
        {
          id: "a1-r-q14",
          numbers: [14],
          prompt: "Section B",
          answer: ["v"],
          explanation: {
            en: "Section B explains that traffic makes low-frequency noise, so low songs are masked while higher notes stay audible.",
            fa: "بخش B توضیح می‌دهد که صدای ترافیک بم است و آوازهای بم زیر آن گم می‌شوند، ولی نت‌های زیرتر شنیده می‌شوند. پس عنوان v درست است.",
          },
          evidence:
            "A bird whose song occupies the same low range finds its message partly or completely masked, much as a voice is lost in a crowded restaurant.",
        },
        {
          id: "a1-r-q15",
          numbers: [15],
          prompt: "Section C",
          answer: ["viii"],
          explanation: {
            en: "Section C lists several strategies: raising the pitch, singing more loudly, singing at night and starting the dawn chorus earlier.",
            fa: "بخش C چند روش مختلف را نام می‌برد: زیرتر خواندن، بلندتر خواندن، آواز در شب و شروع زودتر آواز صبحگاهی. پس عنوان viii درست است.",
          },
          trap: {
            en: "Distractor: street lamps are mentioned in C, but heading ii is about nesting, which the text never discusses",
            fa: "گزینهٔ انحرافی: در C از چراغ خیابان حرف زده شده، اما عنوان ii دربارهٔ لانه‌سازی است که اصلاً در متن نیامده",
          },
          evidence: "Raising the pitch is only one of the strategies that city birds appear to use.",
        },
        {
          id: "a1-r-q16",
          numbers: [16],
          prompt: "Section D",
          answer: ["i"],
          explanation: {
            en: "Section D asks whether the higher songs come from evolution or learning, and says the experiments give mixed results.",
            fa: "بخش D می‌پرسد که آیا این تغییر از راه تکامل است یا یادگیری، و می‌گوید نتیجهٔ آزمایش‌ها یکدست نیست. پس عنوان i یعنی «ابهام دربارهٔ چگونگی ایجاد تغییر» درست است.",
          },
          evidence: "What remains unclear is how these changes come about.",
        },
        {
          id: "a1-r-q17",
          numbers: [17],
          prompt: "Section E",
          answer: ["iii"],
          explanation: {
            en: "Section E says a higher song 'may come at a price': it is heard more often but may be judged less attractive by females.",
            fa: "بخش E می‌گوید آواز زیرتر «may come at a price»؛ یعنی بیشتر شنیده می‌شود، اما ممکن است ماده‌ها آن را کمتر جذاب بدانند. پس عنوان iii درست است.",
          },
          trap: {
            en: "Distractor: body size is mentioned, but the text never says city birds are growing larger (heading vii)",
            fa: "گزینهٔ انحرافی: از اندازهٔ بدن حرف زده شده، اما متن نمی‌گوید پرندگان شهری بزرگ‌تر می‌شوند (عنوان vii)",
          },
          evidence: "Whatever its origin, a higher song may come at a price.",
        },
        {
          id: "a1-r-q18",
          numbers: [18],
          prompt: "Section F",
          answer: ["vi"],
          explanation: {
            en: "Section F describes the limits of early studies and how recordings uploaded by amateur birdwatchers now provide a 'partial solution'.",
            fa: "بخش F اول مشکلات پژوهش‌های قدیمی را می‌گوید و بعد توضیح می‌دهد که ضبط‌های پرنده‌نگرهای آماتور «a partial solution» شده‌اند. پس عنوان vi درست است.",
          },
          evidence: "In recent years, a partial solution has emerged from an unexpected source.",
        },
      ],
    },
    {
      id: "a1-r-g6",
      type: "matching-information",
      interaction: "select",
      title: "Questions 19–21",
      instructions:
        "The text has seven sections, **A–G**.\n\nWhich section contains the following information?\n\nChoose the correct letter, **A–G**.\n\n**NB** You may use any letter more than once.",
      options: sectionLetters,
      items: [
        {
          id: "a1-r-q19",
          numbers: [19],
          prompt: "a comparison with a situation in which human speech is hard to hear",
          answer: ["B"],
          explanation: {
            en: "Section B compares a masked bird song to a voice that 'is lost in a crowded restaurant'.",
            fa: "در بخش B، گم شدن آواز پرنده با گم شدن صدای آدم در یک رستوران شلوغ مقایسه شده: «a voice is lost in a crowded restaurant».",
          },
          trap: { en: "Paraphrase: 'human speech' = 'a voice'", fa: "بیان دیگر: «human speech» همان «a voice» است" },
          evidence:
            "A bird whose song occupies the same low range finds its message partly or completely masked, much as a voice is lost in a crowded restaurant.",
        },
        {
          id: "a1-r-q20",
          numbers: [20],
          prompt: "a reason why a bigger bird is able to sing lower notes",
          answer: ["E"],
          explanation: {
            en: "Section E says larger birds 'tend to have larger vocal organs and can therefore produce lower notes'.",
            fa: "بخش E می‌گوید پرندگان بزرگ‌تر اندام صوتی بزرگ‌تری دارند و به همین دلیل نت‌های بم‌تری می‌خوانند.",
          },
          evidence:
            "In many songbirds, the depth of a male's song is linked to his body size, since larger birds tend to have larger vocal organs and can therefore produce lower notes.",
        },
        {
          id: "a1-r-q21",
          numbers: [21],
          prompt: "a reference to a time when cities became much quieter than usual",
          answer: ["G"],
          explanation: {
            en: "Section G mentions 2020, when travel was restricted and 'traffic in many cities fell sharply'.",
            fa: "بخش G به سال ۲۰۲۰ اشاره می‌کند که رفت‌وآمد محدود شد و ترافیک شهرها به‌شدت کم شد: «traffic in many cities fell sharply».",
          },
          trap: {
            en: "Distractor: section C mentions the night 'when the roads are quieter', but that is a daily pattern, not an unusual time",
            fa: "گزینهٔ انحرافی: در C هم آمده که شب‌ها جاده‌ها خلوت‌ترند، اما این یک اتفاق روزانه است، نه یک دورهٔ غیرعادی",
          },
          evidence:
            "Unexpected support for this view came during the periods of restricted travel in 2020, when traffic in many cities fell sharply.",
        },
      ],
    },
    {
      id: "a1-r-g7",
      type: "multiple-choice",
      interaction: "multi",
      title: "Questions 22–23",
      instructions: "Choose **TWO** letters, **A–E**.",
      choose: 2,
      options: [
        { key: "A", text: "Recordings were made with equipment of differing quality." },
        { key: "B", text: "Studies covered only a small number of places." },
        { key: "C", text: "Researchers frightened birds away while recording them." },
        { key: "D", text: "Most recordings were made at night." },
        { key: "E", text: "Recordings were not labelled with a date or location." },
      ],
      items: [
        {
          id: "a1-r-q22-23",
          numbers: [22, 23],
          prompt: "Which TWO problems with early research into urban birdsong does the writer mention?",
          answer: ["A", "B"],
          explanation: {
            en: "Section F says early evidence 'came from a handful of cities' (B) and that microphones were 'of varying sensitivity' (A).",
            fa: "بخش F می‌گوید شواهد اولیه فقط از «a handful of cities» بود (گزینهٔ B) و میکروفون‌ها «of varying sensitivity» بودند (گزینهٔ A).",
          },
          trap: {
            en: "Distractor: date and location labels are mentioned, but they describe the new amateur recordings, and they are present, not missing",
            fa: "گزینهٔ انحرافی: برچسب تاریخ و مکان در متن آمده، اما دربارهٔ ضبط‌های جدید آماتورهاست و متن می‌گوید این ضبط‌ها برچسب دارند، نه اینکه برچسب نداشته باشند",
          },
          evidence:
            "Much of the early evidence came from a handful of cities, most of them in northern Europe, and it was hard to know whether the findings applied elsewhere. Recordings were also made with microphones of varying sensitivity, which made it risky to compare the results of one study with those of another.",
        },
      ],
    },
    {
      id: "a1-r-g8",
      type: "sentence-completion",
      interaction: "gap",
      title: "Questions 24–25",
      instructions: "Complete the sentences below.\n\nChoose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      content: [
        {
          kind: "paragraph",
          text: "In a laboratory study, young birds that heard recorded traffic produced songs a little higher than those of birds kept in {{24}}.",
        },
        {
          kind: "paragraph",
          text: "Females of several species react more strongly to songs that are {{25}}, which may indicate a healthy partner.",
        },
      ],
      items: [
        {
          id: "a1-r-q24",
          numbers: [24],
          answer: ["silence"],
          explanation: {
            en: "The birds that heard traffic sang 'slightly higher than those of birds raised in silence'.",
            fa: "متن می‌گوید آواز پرنده‌هایی که صدای ترافیک شنیدند کمی زیرتر از پرنده‌هایی بود که «raised in silence» بودند. پس جواب silence است.",
          },
          trap: {
            en: "Distractor: both groups were in 'soundproof rooms', so that phrase does not show the difference",
            fa: "گزینهٔ انحرافی: هر دو گروه در «soundproof rooms» بودند، پس این عبارت تفاوت دو گروه را نشان نمی‌دهد",
          },
          evidence:
            "In one, young birds that were reared in soundproof rooms and exposed only to recordings of traffic developed songs slightly higher than those of birds raised in silence, suggesting that at least some of the flexibility is learned.",
        },
        {
          id: "a1-r-q25",
          numbers: [25],
          answer: ["lower"],
          explanation: {
            en: "'Females of several species respond more strongly to lower songs', treating them as a sign of a healthy partner.",
            fa: "متن می‌گوید ماده‌های چند گونه به «lower songs» واکنش قوی‌تری نشان می‌دهند و آن را نشانهٔ جفتی سالم می‌دانند.",
          },
          trap: {
            en: "Opposite: city males sing higher, but females prefer lower songs",
            fa: "برعکس: نرهای شهری زیرتر می‌خوانند، اما ماده‌ها آواز بم‌تر را ترجیح می‌دهند",
          },
          evidence:
            "Females of several species respond more strongly to lower songs, apparently treating them as a sign of a healthy, well-grown partner.",
        },
      ],
    },
    {
      id: "a1-r-g9",
      type: "short-answer",
      interaction: "gap",
      title: "Question 26",
      instructions: "Answer the question below.\n\nChoose **NO MORE THAN THREE WORDS** from the passage for the answer.",
      content: [
        {
          kind: "paragraph",
          text: "Apart from lower speed limits and planting, what change to roads do some researchers believe could help birds? {{26}}",
        },
      ],
      items: [
        {
          id: "a1-r-q26",
          numbers: [26],
          answer: ["quieter road surfaces", "quieter surfaces"],
          explanation: {
            en: "Section G lists 'quieter road surfaces, lower speed limits in residential areas and belts of dense planting'. The first item is the one not named in the question.",
            fa: "بخش G سه پیشنهاد می‌دهد: «quieter road surfaces»، محدودیت سرعت و کاشت گیاه. دو مورد آخر در خود سؤال آمده‌اند، پس جواب quieter road surfaces است.",
          },
          trap: {
            en: "Word limit: 'lower speed limits in residential areas' is too long and is already excluded by the question",
            fa: "محدودیت کلمه: «lower speed limits in residential areas» هم از حد مجاز کلمه بیشتر است و هم خود سؤال آن را کنار گذاشته است",
          },
          evidence:
            "Some researchers argue that quieter road surfaces, lower speed limits in residential areas and belts of dense planting along major routes could all help.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Part 3: The Missing Half of Science                                */
/* ------------------------------------------------------------------ */

const p3: Part = {
  id: "a1-r-p3",
  number: 3,
  rubric: "Read the text and answer questions 27–40.",
  passage: {
    title: "The Missing Half of Science",
    subtitle: "Why journals should publish the experiments that do not work",
    paragraphs: [
      {
        label: "A",
        text: "Every year, scientists around the world carry out thousands of carefully designed experiments that end in disappointment. A promising drug turns out to work no better than a sugar pill; a predicted link between diet and memory fails to appear. Results in which a study finds no effect are known as negative or null results. They are an ordinary and unavoidable part of research. Yet a reader who relied on the scientific journals alone might conclude that they hardly ever happen.",
      },
      {
        label: "B",
        text: "The reason is not difficult to identify. Journals compete for attention, and studies reporting a surprising discovery are cited more often, covered more widely in the press and therefore more attractive to editors. Researchers, in turn, know that their careers depend on publishing in well-regarded journals. Faced with a study that has 'failed', many simply move on to the next project, and the results are put away and forgotten, a habit so widespread that it has acquired its own name: the file-drawer problem. I do not believe that most scientists who do this are trying to hide anything. They are responding sensibly to a system that rewards some findings and ignores others. But the overall effect is a scientific record that is systematically incomplete. One survey of several thousand papers across a range of disciplines found that the share reporting a positive result had grown steadily over two decades.",
      },
      {
        label: "C",
        text: "This matters for at least three reasons. First, it wastes resources. If one laboratory's failed attempt to grow a particular crystal is never reported, other teams may spend months repeating the same experiment. Second, it misleads. When researchers combine the results of many studies to estimate the true size of an effect, a technique known as meta-analysis, they can only include work that has been published. If the studies that found nothing are missing, the combined figure will overestimate how well a treatment works. Third, and most seriously, it can cause harm. In medicine, a treatment that appears effective on the basis of a few published trials may be prescribed to large numbers of patients, while the unpublished trials that showed no benefit, or even harmful side effects, remain out of sight.",
      },
      {
        label: "D",
        text: "It is sometimes argued that negative results are simply less interesting, and that readers do not want journals filled with experiments that did not work. The statistician Helena Marsh has made a more careful version of this argument, pointing out that a study can fail for many trivial reasons, such as a faulty instrument or too few participants, and that a negative result is therefore harder to interpret than a positive one. This is a fair point, but it is an argument for better-designed studies, not for ignoring their results. A well-designed experiment that finds no effect tells us something just as real as one that does: that a particular explanation is probably wrong, and that effort should be directed elsewhere.",
      },
      {
        label: "E",
        text: "Another objection was once practical. When journals were printed on paper, every page cost money, and editors had to choose. Tomas Ferreira, who edited a leading chemistry journal for many years, once remarked that if he published every experiment that had not worked, his journal would be the size of a telephone directory. That constraint has largely disappeared. Online-only journals have no page limits. The difficulty today is not space but prestige: researchers still prefer to see their names in the most famous journals, and those journals remain reluctant to give room to results that will attract few readers.",
      },
      {
        label: "F",
        text: "Fortunately, there are signs of change. In psychology, a field shaken by repeated failures to reproduce well-known findings, the Halden Institute coordinated an effort in which dozens of independent teams attempted to repeat published experiments. Fewer than half of the original results held up. The shock of that finding has encouraged a practice known as pre-registration, in which researchers publicly record their hypotheses, methods and planned analyses before they collect any data. Because the plan is fixed in advance, it becomes much harder to quietly abandon a study that produces an unwelcome answer.",
      },
      {
        label: "G",
        text: "A further step, which the psychologist Priya Raman has championed for more than a decade, is the registered report. Under this system, a journal reviews a study's design before the research is carried out. If the question is important and the methods are sound, the journal commits to publishing the results, whatever they turn out to be. Raman argues that this moves the judgement to where it belongs: on whether a study is worth doing, rather than on whether its answer happens to be exciting. Some funders have gone further still. The Corbel Foundation, a medical research charity, now withholds part of each grant until the researchers have made all of their results publicly available, including those that show no effect.",
      },
      {
        label: "H",
        text: "None of these reforms is a complete solution, and each brings costs of its own. Pre-registration demands more planning, and some researchers complain that it discourages the kind of unplanned exploration that has led to many important discoveries. But the present situation, in which a large part of what science learns is quietly discarded, is far harder to defend. A body of knowledge built only from successes is not merely incomplete; it is distorted. If we want science to tell us how the world really is, we must be prepared to read about the times it said 'no'.",
      },
    ],
  },
  groups: [
    {
      id: "a1-r-g10",
      type: "ynng",
      interaction: "single",
      title: "Questions 27–29",
      instructions:
        "Do the following statements agree with the claims of the writer in the text?\n\nChoose **YES** if the statement agrees with the claims of the writer\nChoose **NO** if the statement contradicts the claims of the writer\nChoose **NOT GIVEN** if it is impossible to say what the writer thinks about this",
      items: [
        {
          id: "a1-r-q27",
          numbers: [27],
          prompt: "Scientists who leave negative results unpublished are usually trying to conceal them.",
          options: ynng,
          answer: ["NO"],
          explanation: {
            en: "The writer says 'I do not believe that most scientists who do this are trying to hide anything', so the statement contradicts the writer's view.",
            fa: "نویسنده صریحاً می‌گوید «I do not believe that most scientists who do this are trying to hide anything». یعنی به نظر او بیشتر دانشمندان قصد پنهان‌کاری ندارند، پس جواب NO است.",
          },
          trap: {
            en: "Paraphrase: 'conceal' = 'hide'; the negative is in 'I do not believe'",
            fa: "بیان دیگر: «conceal» یعنی «hide»؛ منفی بودن جمله در «I do not believe» است",
          },
          evidence: "I do not believe that most scientists who do this are trying to hide anything.",
        },
        {
          id: "a1-r-q28",
          numbers: [28],
          prompt: "Scientists today carry out fewer unsuccessful experiments than they did twenty years ago.",
          options: ynng,
          answer: ["NOT GIVEN"],
          explanation: {
            en: "The survey is about the share of published papers reporting positive results, not about how many experiments fail. The writer says nothing about the number of unsuccessful experiments over time.",
            fa: "آن نظرسنجی دربارهٔ سهم مقاله‌های «منتشرشده» با نتیجهٔ مثبت است، نه تعداد آزمایش‌هایی که شکست می‌خورند. نویسنده دربارهٔ تغییر تعداد آزمایش‌های ناموفق چیزی نمی‌گوید، پس جواب NOT GIVEN است.",
          },
          trap: {
            en: "Published vs carried out: more positive papers does not mean fewer failed experiments",
            fa: "منتشر شدن با انجام شدن فرق دارد: بیشتر شدن مقاله‌های مثبت به این معنا نیست که آزمایش‌های ناموفق کمتر شده‌اند",
          },
          evidence:
            "One survey of several thousand papers across a range of disciplines found that the share reporting a positive result had grown steadily over two decades.",
        },
        {
          id: "a1-r-q29",
          numbers: [29],
          prompt: "A carefully planned study that finds no effect can be as informative as one that does.",
          options: ynng,
          answer: ["YES"],
          explanation: {
            en: "The writer says a well-designed experiment that finds no effect 'tells us something just as real as one that does'.",
            fa: "نویسنده می‌گوید آزمایشی که خوب طراحی شده و اثری پیدا نمی‌کند «tells us something just as real as one that does»، یعنی به همان اندازه اطلاعات مفید می‌دهد. پس جواب YES است.",
          },
          trap: {
            en: "Distractor: Helena Marsh's view that negative results are harder to interpret is not the writer's own view",
            fa: "گزینهٔ انحرافی: نظر Helena Marsh که نتایج منفی سخت‌تر تفسیر می‌شوند، نظر خود نویسنده نیست",
          },
          evidence:
            "A well-designed experiment that finds no effect tells us something just as real as one that does:",
        },
      ],
    },
    {
      id: "a1-r-g11",
      type: "multiple-choice",
      interaction: "single",
      title: "Questions 30–31",
      instructions: "Choose the correct letter, **A**, **B**, **C** or **D**.",
      items: [
        {
          id: "a1-r-q30",
          numbers: [30],
          prompt: "What does the writer say about researchers who do not publish negative results?",
          options: [
            { key: "A", text: "They are often unaware that their results are negative." },
            { key: "B", text: "They are acting reasonably within the system they work in." },
            { key: "C", text: "They are prevented from publishing by journal rules." },
            { key: "D", text: "They are embarrassed by experiments that fail." },
          ],
          answer: ["B"],
          explanation: {
            en: "The writer says they are 'responding sensibly to a system that rewards some findings and ignores others'.",
            fa: "نویسنده می‌گوید این پژوهشگرها «responding sensibly to a system» هستند؛ یعنی در نظامی که فقط بعضی نتایج را پاداش می‌دهد، رفتار منطقی‌ای دارند. پس گزینهٔ B درست است.",
          },
          trap: {
            en: "Plausible but not stated: embarrassment (D) and journal rules (C) are never mentioned",
            fa: "گزینه‌های باورپذیر اما ذکرنشده: خجالت (D) و قوانین مجله (C) اصلاً در متن نیامده‌اند",
          },
          evidence: "They are responding sensibly to a system that rewards some findings and ignores others.",
        },
        {
          id: "a1-r-q31",
          numbers: [31],
          prompt: "The writer mentions an attempt to grow a crystal in order to illustrate",
          options: [
            { key: "A", text: "how failed experiments can lead to new discoveries." },
            { key: "B", text: "the difficulty of reproducing experiments in chemistry." },
            { key: "C", text: "the risk that different teams repeat the same unsuccessful work." },
            { key: "D", text: "the high cost of laboratory equipment." },
          ],
          answer: ["C"],
          explanation: {
            en: "The crystal example shows that if a failed attempt is not reported, 'other teams may spend months repeating the same experiment'.",
            fa: "مثال کریستال نشان می‌دهد اگر یک آزمایش ناموفق گزارش نشود، تیم‌های دیگر ممکن است ماه‌ها همان آزمایش را تکرار کنند. پس گزینهٔ C درست است.",
          },
          trap: {
            en: "Distractor: 'repeating' may suggest reproducing results (B), but the point is wasted effort",
            fa: "گزینهٔ انحرافی: کلمهٔ «repeating» ممکن است شما را به گزینهٔ B ببرد، اما منظور هدر رفتن وقت و هزینه است",
          },
          evidence:
            "If one laboratory's failed attempt to grow a particular crystal is never reported, other teams may spend months repeating the same experiment.",
        },
      ],
    },
    {
      id: "a1-r-g12",
      type: "matching-features",
      interaction: "select",
      title: "Questions 32–34",
      instructions:
        "Look at the following statements (Questions 32–34) and the list of people and organisations below.\n\nMatch each statement with the correct person or organisation, **A–E**.\n\n**NB** You may use any letter more than once.",
      optionsTitle: "List of People and Organisations",
      options: [
        { key: "A", text: "Helena Marsh" },
        { key: "B", text: "Tomas Ferreira" },
        { key: "C", text: "the Halden Institute" },
        { key: "D", text: "Priya Raman" },
        { key: "E", text: "the Corbel Foundation" },
      ],
      items: [
        {
          id: "a1-r-q32",
          numbers: [32],
          prompt: "organised a large attempt to repeat earlier research",
          answer: ["C"],
          explanation: {
            en: "The Halden Institute 'coordinated an effort in which dozens of independent teams attempted to repeat published experiments'.",
            fa: "طبق متن، Halden Institute طرحی را هماهنگ کرد که در آن ده‌ها تیم مستقل تلاش کردند آزمایش‌های منتشرشده را تکرار کنند.",
          },
          trap: { en: "Paraphrase: 'organised' = 'coordinated'", fa: "بیان دیگر: «organised» همان «coordinated» است" },
          evidence:
            "In psychology, a field shaken by repeated failures to reproduce well-known findings, the Halden Institute coordinated an effort in which dozens of independent teams attempted to repeat published experiments.",
        },
        {
          id: "a1-r-q33",
          numbers: [33],
          prompt: "pointed out that a study might find nothing because of a technical fault",
          answer: ["A"],
          explanation: {
            en: "Helena Marsh says a study can fail for trivial reasons 'such as a faulty instrument'.",
            fa: "Helena Marsh می‌گوید یک پژوهش ممکن است به دلایل ساده‌ای شکست بخورد، مثلاً «a faulty instrument» یعنی خرابی ابزار.",
          },
          evidence:
            "The statistician Helena Marsh has made a more careful version of this argument, pointing out that a study can fail for many trivial reasons, such as a faulty instrument or too few participants, and that a negative result is therefore harder to interpret than a positive one.",
        },
        {
          id: "a1-r-q34",
          numbers: [34],
          prompt: "makes part of its financial support depend on the publication of all findings",
          answer: ["E"],
          explanation: {
            en: "The Corbel Foundation 'withholds part of each grant until the researchers have made all of their results publicly available'.",
            fa: "Corbel Foundation بخشی از بودجهٔ هر پروژه را نگه می‌دارد تا پژوهشگرها همهٔ نتایجشان را منتشر کنند.",
          },
          trap: {
            en: "Distractor: Priya Raman is in the same paragraph, but she supports registered reports, not funding rules",
            fa: "گزینهٔ انحرافی: Priya Raman در همان پاراگراف آمده، اما او طرفدار registered report است، نه قوانین بودجه",
          },
          evidence:
            "The Corbel Foundation, a medical research charity, now withholds part of each grant until the researchers have made all of their results publicly available, including those that show no effect.",
        },
      ],
    },
    {
      id: "a1-r-g13",
      type: "matching-sentence-endings",
      interaction: "select",
      title: "Questions 35–36",
      instructions: "Complete each sentence with the correct ending, **A–E**, below.",
      optionsTitle: "List of Endings",
      options: [
        { key: "A", text: "makes it harder to abandon a study whose answer is unwelcome." },
        { key: "B", text: "has been shown to reduce the overall cost of research." },
        { key: "C", text: "has made the most famous journals keen to publish negative findings." },
        { key: "D", text: "has removed one traditional reason for leaving negative results unpublished." },
        { key: "E", text: "is suitable only for trials of new medicines." },
      ],
      items: [
        {
          id: "a1-r-q35",
          numbers: [35],
          prompt: "The arrival of online-only journals",
          answer: ["D"],
          explanation: {
            en: "Printed journals had limited pages, but 'Online-only journals have no page limits', so lack of space is no longer a reason to reject negative results.",
            fa: "مجله‌های چاپی صفحهٔ محدود داشتند، اما «Online-only journals have no page limits». پس کمبود جا دیگر دلیلی برای منتشر نکردن نتایج منفی نیست: گزینهٔ D.",
          },
          trap: {
            en: "Distractor: famous journals 'remain reluctant', so C is the opposite of the text",
            fa: "گزینهٔ انحرافی: متن می‌گوید مجله‌های معروف هنوز «remain reluctant» هستند، پس گزینهٔ C برعکس متن است",
          },
          evidence:
            "That constraint has largely disappeared. Online-only journals have no page limits.",
        },
        {
          id: "a1-r-q36",
          numbers: [36],
          prompt: "Pre-registration",
          answer: ["A"],
          explanation: {
            en: "Because the plan is fixed in advance, 'it becomes much harder to quietly abandon a study that produces an unwelcome answer'.",
            fa: "چون برنامهٔ پژوهش از قبل ثبت می‌شود، کنار گذاشتن بی‌سروصدای پژوهشی که جواب ناخوشایند می‌دهد خیلی سخت‌تر می‌شود. پس گزینهٔ A درست است.",
          },
          trap: {
            en: "Distractor: the text says pre-registration 'demands more planning', not that it reduces costs (B)",
            fa: "گزینهٔ انحرافی: متن می‌گوید pre-registration برنامه‌ریزی بیشتری لازم دارد، نه اینکه هزینه را کم می‌کند (B)",
          },
          evidence:
            "Because the plan is fixed in advance, it becomes much harder to quietly abandon a study that produces an unwelcome answer.",
        },
      ],
    },
    {
      id: "a1-r-g14",
      type: "summary-completion",
      interaction: "gap",
      title: "Questions 37–38",
      instructions: "Complete the summary below.\n\nChoose **NO MORE THAN TWO WORDS** from the passage for each answer.",
      content: [
        { kind: "heading", text: "Why missing results matter" },
        {
          kind: "paragraph",
          text: "Because journals prefer surprising discoveries, many studies that find no effect are never published, a habit known as the {{37}} problem. This wastes resources, since other teams may unknowingly repeat the same work. It is also misleading: when the published studies are combined in a meta-analysis, the result is likely to {{38}} the size of an effect or the benefit of a treatment.",
        },
      ],
      items: [
        {
          id: "a1-r-q37",
          numbers: [37],
          answer: ["file-drawer", "file drawer"],
          explanation: {
            en: "The habit of putting failed results away 'has acquired its own name: the file-drawer problem'.",
            fa: "متن می‌گوید این عادتِ کنار گذاشتن نتایج ناموفق اسم خاصی دارد: «the file-drawer problem». کلمه‌ای که خط تیره دارد یک کلمه حساب می‌شود.",
          },
          trap: {
            en: "Word limit: a hyphenated word counts as one word",
            fa: "محدودیت کلمه: کلمه‌ای که خط تیره دارد یک کلمه حساب می‌شود",
          },
          evidence:
            "Faced with a study that has 'failed', many simply move on to the next project, and the results are put away and forgotten, a habit so widespread that it has acquired its own name: the file-drawer problem.",
        },
        {
          id: "a1-r-q38",
          numbers: [38],
          answer: ["overestimate"],
          explanation: {
            en: "If the studies that found nothing are missing, 'the combined figure will overestimate how well a treatment works'.",
            fa: "متن می‌گوید اگر پژوهش‌هایی که اثری پیدا نکردند کنار گذاشته شوند، نتیجهٔ ترکیبی میزان اثر درمان را بیشتر از واقع نشان می‌دهد: «overestimate».",
          },
          trap: {
            en: "Grammar: after 'likely to' you need the base verb 'overestimate'",
            fa: "دستور زبان: بعد از «likely to» شکل سادهٔ فعل لازم است، یعنی overestimate",
          },
          evidence:
            "If the studies that found nothing are missing, the combined figure will overestimate how well a treatment works.",
        },
      ],
    },
    {
      id: "a1-r-g15",
      type: "note-completion",
      interaction: "gap",
      title: "Questions 39–40",
      instructions: "Complete the notes below.\n\nChoose **ONE WORD ONLY** from the passage for each answer.",
      content: [
        { kind: "heading", text: "Proposed changes to research and publishing" },
        {
          kind: "list",
          items: [
            "Pre-registration: hypotheses, methods and analyses are made public before any {{39}} is collected",
            "Registered reports: the decision to publish depends on whether a study is worth doing, not on whether its answer is {{40}}",
            "Funding rules: part of a grant may be held back until all results are public",
          ],
        },
      ],
      items: [
        {
          id: "a1-r-q39",
          numbers: [39],
          answer: ["data"],
          explanation: {
            en: "Researchers record their hypotheses, methods and planned analyses 'before they collect any data'.",
            fa: "طبق متن، پژوهشگرها فرضیه‌ها، روش‌ها و تحلیل‌هایشان را «before they collect any data» یعنی پیش از جمع‌آوری داده ثبت می‌کنند.",
          },
          evidence:
            "The shock of that finding has encouraged a practice known as pre-registration, in which researchers publicly record their hypotheses, methods and planned analyses before they collect any data.",
        },
        {
          id: "a1-r-q40",
          numbers: [40],
          answer: ["exciting"],
          explanation: {
            en: "Raman says registered reports judge 'whether a study is worth doing, rather than on whether its answer happens to be exciting'.",
            fa: "به گفتهٔ Raman، در registered report ملاک این است که آیا پژوهش ارزش انجام دادن دارد، نه اینکه جوابش «exciting» یعنی هیجان‌انگیز باشد.",
          },
          trap: {
            en: "Distractor: 'important' and 'sound' describe the question and methods, not the answer",
            fa: "گزینهٔ انحرافی: «important» و «sound» دربارهٔ سؤال و روش پژوهش‌اند، نه جواب آن",
          },
          evidence:
            "Raman argues that this moves the judgement to where it belongs: on whether a study is worth doing, rather than on whether its answer happens to be exciting.",
        },
      ],
    },
  ],
};

export const readingSection: Section = {
  id: "a1-reading",
  skill: "reading",
  title: "Academic Reading",
  durationSec: 3600,
  parts: [p1, p2, p3],
};
