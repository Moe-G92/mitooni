import type { Section } from "@/api/schemas";

/*
 * Academic Test 1, Listening. ORIGINAL dummy content written for the prototype:
 * every scenario, name, script and question is invented.
 * Audio files are generated from the transcripts with the Kokoro text-to-speech model (see listeningVoices
 * and scripts/make-audio.ts). Kokoro has British and American voices only; the content team's real
 * recordings should add the Australian and other accents the real test uses.
 */

export const listeningSection: Section = {
  id: "a1-listening",
  skill: "listening",
  title: "Listening",
  durationSec: 0 /* filled in after audio is generated */,
  parts: [
    /* ------------------------------------------------------------ */
    /*  Part 1: phone call to a ceramics studio                      */
    /* ------------------------------------------------------------ */
    {
      id: "a1-l-p1",
      number: 1,
      rubric: "Listen and answer questions 1–10.",
      audio: {
        src: "/audio/academic-1/listening-part-1.m4a",
        durationSec: 0,
        transcript: [
          { speaker: "Narrator", text: "Part 1. You will hear a woman phoning a ceramics studio to ask about becoming a member. First, you have some time to look at questions 1 to 6." },
          { speaker: "Narrator", text: "Now listen carefully and answer questions 1 to 6." },
          { speaker: "Martin", text: "Good morning, Lindale Ceramics Studio, Martin speaking. How can I help?" },
          { speaker: "Joanne", text: "Oh, hello. I saw that you're taking on new members this autumn, and I'd like to sign up, if there's still room." },
          { speaker: "Martin", text: "There is, yes. I can take your details over the phone now and post you the paperwork. Could I start with your name?" },
          { speaker: "Joanne", text: "It's Joanne. Joanne Tilbrook." },
          { speaker: "Martin", text: "Could you spell the surname for me?" },
          { speaker: "Joanne", text: "Sure. T-I-L-B-R-O-O-K." },
          { speaker: "Martin", text: "Is that one O or two?" },
          { speaker: "Joanne", text: "Two. Double O, then K." },
          { speaker: "Martin", text: "Lovely. And your address?" },
          { speaker: "Joanne", text: "It's seventy-three Mill Lane. Oh, sorry, I always get that the wrong way round. It's thirty-seven, three seven, Mill Lane, in Ashby." },
          { speaker: "Martin", text: "Thirty-seven Mill Lane. Got it. Now, members can book the studio on one weekday each week. Which day would suit you best?" },
          { speaker: "Joanne", text: "I was hoping for Tuesday evenings." },
          { speaker: "Martin", text: "Ah, I'm afraid Tuesday is completely full until January. We do have space on Wednesday and Thursday." },
          { speaker: "Joanne", text: "Wednesday's no good, I work late. Thursday, then." },
          { speaker: "Martin", text: "Thursday it is. Can I ask how you heard about us? We like to keep track." },
          { speaker: "Joanne", text: "Well, a friend of mine has mentioned you a few times, but what actually made me ring was an article in the local newspaper last week, about your open day." },
          { speaker: "Martin", text: "That's good to know. Now, is there anything we should be aware of health-wise? Some clays and glazes can irritate the skin." },
          { speaker: "Joanne", text: "Yes, actually. I'm fine with clay itself, and dust doesn't bother me, but I'm allergic to latex, so I can't wear the usual gloves." },
          { speaker: "Martin", text: "That's no problem, we keep vinyl ones too. And finally, the membership fee. The standard yearly fee is ninety pounds, but since you're joining after September, it's reduced to fifty-five pounds." },
          { speaker: "Joanne", text: "Oh, that's a nice surprise. Fifty-five is fine." },
          { speaker: "Narrator", text: "Before you hear the rest of the conversation, you have some time to look at questions 7 to 10." },
          { speaker: "Narrator", text: "Now listen and answer questions 7 to 10." },
          { speaker: "Joanne", text: "While I've got you, could you tell me about the courses? I've never actually used a potter's wheel." },
          { speaker: "Martin", text: "Of course. The most popular is wheel throwing. It used to run for six weeks, but people found that too short, so it's now eight weeks. It costs a hundred and eighty pounds, and that covers all your clay and firing." },
          { speaker: "Joanne", text: "And is there something gentler to begin with?" },
          { speaker: "Martin", text: "Hand building is a good start. That's six weeks, and it's cheaper, one hundred and twenty pounds." },
          { speaker: "Martin", text: "The only thing is you'll need to bring your own apron. We provide all the tools, but aprons kept going missing, so we stopped lending them." },
          { speaker: "Joanne", text: "Fair enough. Is there anything shorter?" },
          { speaker: "Martin", text: "There's a one-day glaze workshop for sixty-five pounds. In winter it's held in the main studio, but this term it's in the garden, under the big covered area, so wrap up warm." },
          { speaker: "Joanne", text: "That sounds lovely. I think I'll start with hand building. Thanks so much, Martin." },
          { speaker: "Martin", text: "My pleasure. The forms should reach you by Friday." },
          { speaker: "Narrator", text: "That is the end of part 1." },
        ],
      },
      groups: [
        {
          id: "a1-l-g1",
          type: "form-completion",
          interaction: "gap",
          title: "Questions 1–6",
          instructions: "Complete the form below.\nWrite **ONE WORD AND/OR A NUMBER** for each answer.",
          content: [
            { kind: "heading", text: "Lindale Ceramics Studio: new member details" },
            {
              kind: "list",
              items: [
                "Name: Joanne {{1}}",
                "Address: {{2}} Mill Lane, Ashby",
                "Preferred studio day: {{3}}",
                "Heard about the studio from: an article in the local {{4}}",
                "Health note: allergic to {{5}}",
                "Fee for this year: £{{6}}",
              ],
            },
          ],
          items: [
            {
              id: "a1-l-q1",
              numbers: [1],
              answer: ["Tilbrook"],
              explanation: {
                en: "Joanne spells her surname letter by letter, T-I-L-B-R-O-O-K, and confirms it has a double O.",
                fa: "جوآن نام خانوادگی‌اش را حرف‌به‌حرف هجی می‌کند، T-I-L-B-R-O-O-K، و تأیید می‌کند که دو حرف O دارد.",
              },
              trap: { en: "Spelling", fa: "املای کلمه: هجی حرف‌به‌حرف" },
              evidence: "Sure. T-I-L-B-R-O-O-K.",
            },
            {
              id: "a1-l-q2",
              numbers: [2],
              answer: ["37", "thirty-seven", "thirty seven"],
              explanation: {
                en: "She first says seventy-three, then corrects herself: the house number is thirty-seven.",
                fa: "او اول می‌گوید هفتاد و سه، اما بلافاصله حرفش را اصلاح می‌کند؛ پلاک خانه سی و هفت (37) است.",
              },
              trap: { en: "Speaker corrects themselves", fa: "گوینده حرفش را اصلاح می‌کند" },
              evidence: "It's thirty-seven, three seven, Mill Lane, in Ashby.",
            },
            {
              id: "a1-l-q3",
              numbers: [3],
              answer: ["Thursday"],
              explanation: {
                en: "Tuesday is full and Wednesday clashes with her work, so she chooses Thursday.",
                fa: "سه‌شنبه پر است و چهارشنبه با کارش تداخل دارد، پس پنجشنبه (Thursday) را انتخاب می‌کند.",
              },
              trap: { en: "Distractor: Tuesday and Wednesday are mentioned first", fa: "گزینهٔ انحرافی: اول از سه‌شنبه و چهارشنبه صحبت می‌شود" },
              evidence: "Wednesday's no good, I work late. Thursday, then.",
            },
            {
              id: "a1-l-q4",
              numbers: [4],
              answer: ["newspaper"],
              explanation: {
                en: "A friend mentioned the studio, but what made her call was an article in the local newspaper.",
                fa: "دوستش از استودیو حرف زده بود، اما چیزی که باعث شد تماس بگیرد مقاله‌ای در روزنامهٔ محلی (newspaper) بود.",
              },
              trap: { en: "Distractor: a friend is mentioned first", fa: "گزینهٔ انحرافی: اول از یک دوست صحبت می‌شود" },
              evidence: "what actually made me ring was an article in the local newspaper last week",
            },
            {
              id: "a1-l-q5",
              numbers: [5],
              answer: ["latex"],
              explanation: {
                en: "Clay and dust are fine for her; the allergy is to latex.",
                fa: "خاک رس و گردوغبار برایش مشکلی ندارند؛ حساسیت او به latex است.",
              },
              trap: { en: "Distractor: clay and dust are mentioned", fa: "گزینهٔ انحرافی: از خاک رس و گردوغبار هم نام برده می‌شود" },
              evidence: "but I'm allergic to latex, so I can't wear the usual gloves.",
            },
            {
              id: "a1-l-q6",
              numbers: [6],
              answer: ["55", "fifty-five", "fifty five"],
              explanation: {
                en: "The standard fee is ninety pounds, but it is reduced to fifty-five because she is joining after September.",
                fa: "هزینهٔ معمول نود پوند است، اما چون بعد از سپتامبر عضو می‌شود، به پنجاه و پنج پوند (55) کاهش پیدا می‌کند.",
              },
              trap: { en: "Distractor: the full fee is given first", fa: "گزینهٔ انحرافی: اول هزینهٔ کامل گفته می‌شود" },
              evidence: "it's reduced to fifty-five pounds",
            },
          ],
        },
        {
          id: "a1-l-g2",
          type: "table-completion",
          interaction: "gap",
          title: "Questions 7–10",
          instructions: "Complete the table below.\nWrite **ONE WORD AND/OR A NUMBER** for each answer.",
          content: [
            { kind: "heading", text: "Courses for members" },
            {
              kind: "table",
              header: ["Course", "Length", "Cost", "Notes"],
              rows: [
                ["Wheel throwing", "{{7}} weeks", "£180", "clay and firing included"],
                ["Hand building", "6 weeks", "£{{8}}", "bring your own {{9}}"],
                ["Glaze workshop", "one day", "£65", "this term held in the {{10}}"],
              ],
            },
          ],
          items: [
            {
              id: "a1-l-q7",
              numbers: [7],
              answer: ["8", "eight"],
              explanation: {
                en: "The course used to be six weeks long, but it now runs for eight weeks.",
                fa: "این دوره قبلاً شش هفته بود، اما الان هشت هفته (8) طول می‌کشد.",
              },
              trap: { en: "Distractor: the old length is mentioned", fa: "گزینهٔ انحرافی: طول قبلی دوره هم گفته می‌شود" },
              evidence: "so it's now eight weeks",
            },
            {
              id: "a1-l-q8",
              numbers: [8],
              answer: ["120", "one hundred and twenty", "a hundred and twenty"],
              explanation: {
                en: "Hand building is cheaper than wheel throwing: one hundred and twenty pounds.",
                fa: "دورهٔ Hand building ارزان‌تر از wheel throwing است و ۱۲۰ پوند هزینه دارد.",
              },
              trap: { en: "Distractor: £180 for the other course is heard just before", fa: "گزینهٔ انحرافی: کمی قبل‌تر قیمت ۱۸۰ پوند برای دورهٔ دیگر گفته می‌شود" },
              evidence: "and it's cheaper, one hundred and twenty pounds.",
            },
            {
              id: "a1-l-q9",
              numbers: [9],
              answer: ["apron"],
              explanation: {
                en: "The studio provides the tools, but learners must bring their own apron.",
                fa: "استودیو ابزارها را می‌دهد، اما شرکت‌کننده‌ها باید پیش‌بند (apron) خودشان را بیاورند.",
              },
              trap: { en: "Distractor: tools are provided", fa: "گزینهٔ انحرافی: ابزارها را خود استودیو می‌دهد" },
              evidence: "The only thing is you'll need to bring your own apron.",
            },
            {
              id: "a1-l-q10",
              numbers: [10],
              answer: ["garden"],
              explanation: {
                en: "The workshop is usually in the main studio in winter, but this term it is held in the garden.",
                fa: "این کارگاه در زمستان معمولاً در استودیوی اصلی است، اما این ترم در باغ (garden) برگزار می‌شود.",
              },
              trap: { en: "Distractor: the main studio is mentioned first", fa: "گزینهٔ انحرافی: اول از استودیوی اصلی نام برده می‌شود" },
              evidence: "but this term it's in the garden",
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    /*  Part 2: volunteer induction at a wetland reserve             */
    /* ------------------------------------------------------------ */
    {
      id: "a1-l-p2",
      number: 2,
      rubric: "Listen and answer questions 11–20.",
      audio: {
        src: "/audio/academic-1/listening-part-2.m4a",
        durationSec: 0,
        transcript: [
          { speaker: "Narrator", text: "Part 2. You will hear a volunteer coordinator talking to a group of new volunteers at a wetland nature reserve. First, you have some time to look at questions 11 to 17." },
          { speaker: "Narrator", text: "Now listen carefully and answer questions 11 to 17." },
          { speaker: "Fiona", text: "Good morning, everyone, and welcome to Hollins Marsh. I'm Fiona, and I coordinate the volunteer programme here. Before we head outside, let me tell you a little about the place." },
          { speaker: "Fiona", text: "Many visitors assume the reserve was once farmland, and it's true there were sheep grazing nearby. But this site was actually a gravel quarry until the late nineteen-eighties." },
          { speaker: "Fiona", text: "When the digging stopped, the pits filled with water, and that's how the lakes were formed. Nobody planned it, and the river is nowhere near here." },
          { speaker: "Fiona", text: "On your first day, you won't be sent off to work on your own. Some people expect a long safety lecture, but we keep that very short." },
          { speaker: "Fiona", text: "What you'll actually do is spend the morning walking the site with an experienced volunteer, so you learn where everything is." },
          { speaker: "Fiona", text: "As for what to bring, we lend out binoculars, so don't worry about those, and the café does sandwiches, so you needn't pack a lunch." },
          { speaker: "Fiona", text: "The one thing we can't supply is waterproof boots in every size, so please bring your own." },
          { speaker: "Fiona", text: "Now, if you look at the map, you'll see we're in the visitor centre, just to the right of the main path as you come in through the main gate. Let me point out a few places you'll need." },
          { speaker: "Fiona", text: "First, the bird hide. Walk north up the main path until you reach the crossroads, then turn right onto the lake path." },
          { speaker: "Fiona", text: "Follow it past the little jetty, right to the end. The hide is just beyond that, looking out over the eastern shore of the lake." },
          { speaker: "Fiona", text: "Next, the picnic area. A lot of people look for it beside the car park, but it's actually directly opposite where we're standing now, on the other side of the main path." },
          { speaker: "Fiona", text: "The tool store is where you'll collect your equipment each morning. Keep going up the main path, past the crossroads, all the way to the top where it ends." },
          { speaker: "Fiona", text: "The woodland is on your left there, but the tool store is on your right." },
          { speaker: "Fiona", text: "And finally, the first aid point. It's at the crossroads, in the corner between the main path and the lake path, on the side nearest the lake." },
          { speaker: "Narrator", text: "Before you hear the rest of the talk, you have some time to look at questions 18 to 20." },
          { speaker: "Narrator", text: "Now listen and answer questions 18 to 20." },
          { speaker: "Fiona", text: "Lastly, let me tell you when our regular team activities take place, as the timetable has changed this year." },
          { speaker: "Fiona", text: "Hedge laying used to happen on Saturdays, but so many of you asked for a weekday that we've moved it to Tuesday mornings." },
          { speaker: "Fiona", text: "The bird survey is early on Sunday, I'm afraid, because that's when the reserve is quietest. Some of you may have seen Thursday on the old leaflet, but please ignore that." },
          { speaker: "Fiona", text: "And path repairs, which are hard work but very satisfying, are on Monday, after the weekend visitors have worn things down." },
          { speaker: "Fiona", text: "Right, if there are no questions, let's find you some boots and head out." },
          { speaker: "Narrator", text: "That is the end of part 2." },
        ],
      },
      groups: [
        {
          id: "a1-l-g3",
          type: "multiple-choice",
          interaction: "single",
          title: "Questions 11–13",
          instructions: "Choose the correct letter, **A**, **B** or **C**.",
          items: [
            {
              id: "a1-l-q11",
              numbers: [11],
              prompt: "How were the lakes at Hollins Marsh formed?",
              options: [
                { key: "A", text: "Farmland was flooded on purpose." },
                { key: "B", text: "Water filled an old quarry." },
                { key: "C", text: "A nearby river changed its course." },
              ],
              answer: ["B"],
              explanation: {
                en: "The site was a gravel quarry, and the pits filled with water when the digging stopped. Farmland and the river are both ruled out.",
                fa: "این محل قبلاً معدن شن بوده و بعد از توقف حفاری، گودال‌ها پر از آب شده‌اند. زمین کشاورزی و رودخانه هر دو کنار گذاشته می‌شوند.",
              },
              trap: { en: "Distractor: farmland and a river are mentioned", fa: "گزینهٔ انحرافی: از زمین کشاورزی و رودخانه هم صحبت می‌شود" },
              evidence: "When the digging stopped, the pits filled with water, and that's how the lakes were formed.",
            },
            {
              id: "a1-l-q12",
              numbers: [12],
              prompt: "On their first day, new volunteers will",
              options: [
                { key: "A", text: "attend a long safety talk." },
                { key: "B", text: "start work on their own." },
                { key: "C", text: "tour the site with an experienced volunteer." },
              ],
              answer: ["C"],
              explanation: {
                en: "Fiona says they will not work alone and the safety talk is short; they spend the morning walking the site with an experienced volunteer.",
                fa: "فیونا می‌گوید داوطلب‌ها تنها کار نمی‌کنند و توضیحات ایمنی کوتاه است؛ آن‌ها صبح را همراه یک داوطلب باتجربه به گشت‌زدن در محل می‌گذرانند.",
              },
              trap: { en: "Distractor: options A and B are mentioned and rejected", fa: "گزینهٔ انحرافی: گزینه‌های A و B گفته و بعد رد می‌شوند" },
              evidence: "What you'll actually do is spend the morning walking the site with an experienced volunteer, so you learn where everything is.",
            },
            {
              id: "a1-l-q13",
              numbers: [13],
              prompt: "What does Fiona ask volunteers to bring?",
              options: [
                { key: "A", text: "binoculars" },
                { key: "B", text: "a packed lunch" },
                { key: "C", text: "waterproof boots" },
              ],
              answer: ["C"],
              explanation: {
                en: "Binoculars are lent out and the café sells sandwiches, but the reserve cannot supply boots in every size.",
                fa: "دوربین دوچشمی امانت داده می‌شود و کافه ساندویچ دارد، اما چکمه در همهٔ سایزها موجود نیست، پس باید چکمهٔ ضدآب بیاورند.",
              },
              trap: { en: "Distractor: all three items are mentioned", fa: "گزینهٔ انحرافی: هر سه مورد در متن شنیده می‌شوند" },
              evidence: "The one thing we can't supply is waterproof boots in every size, so please bring your own.",
            },
          ],
        },
        {
          id: "a1-l-g4",
          type: "plan-map-diagram-labelling",
          interaction: "grid",
          title: "Questions 14–17",
          instructions: "Label the map below.\nWrite the correct letter, **A–H**, next to Questions 14–17.",
          figure: "l2-map",
          options: ["A", "B", "C", "D", "E", "F", "G", "H"].map((key) => ({ key, text: key })),
          items: [
            {
              id: "a1-l-q14",
              numbers: [14],
              prompt: "Bird hide",
              answer: ["D"],
              explanation: {
                en: "North to the crossroads, right onto the lake path, past the jetty (E) to the end: the hide is beyond it on the eastern shore, at D.",
                fa: "از مسیر اصلی به سمت شمال تا چهارراه بروید، بعد به راست و وارد مسیر کنار دریاچه شوید و از کنار اسکله (E) تا انتهای مسیر بروید؛ پناهگاه پرنده‌نگری در ساحل شرقی است، یعنی D.",
              },
              trap: { en: "Distractor: the jetty is passed on the way", fa: "گزینهٔ انحرافی: در مسیر از کنار اسکله رد می‌شوید" },
              evidence: "The hide is just beyond that, looking out over the eastern shore of the lake.",
            },
            {
              id: "a1-l-q15",
              numbers: [15],
              prompt: "Picnic area",
              answer: ["G"],
              explanation: {
                en: "It is directly opposite the visitor centre, across the main path, at G, not beside the car park.",
                fa: "محل پیک‌نیک درست روبه‌روی مرکز بازدیدکنندگان، آن طرف مسیر اصلی، یعنی G است، نه کنار پارکینگ.",
              },
              trap: { en: "Distractor: the car park", fa: "گزینهٔ انحرافی: کنار پارکینگ" },
              evidence: "but it's actually directly opposite where we're standing now, on the other side of the main path.",
            },
            {
              id: "a1-l-q16",
              numbers: [16],
              prompt: "Tool store",
              answer: ["C"],
              explanation: {
                en: "At the top end of the main path, the woodland is on the left and the tool store is on the right, at C.",
                fa: "در انتهای بالایی مسیر اصلی، جنگل سمت چپ و انبار ابزار سمت راست است، یعنی C.",
              },
              trap: { en: "Distractor: the woodland on the left (B)", fa: "گزینهٔ انحرافی: جنگل در سمت چپ (B)" },
              evidence: "The woodland is on your left there, but the tool store is on your right.",
            },
            {
              id: "a1-l-q17",
              numbers: [17],
              prompt: "First aid point",
              answer: ["H"],
              explanation: {
                en: "It is in the corner of the crossroads between the main path and the lake path, on the lake side, at H.",
                fa: "در گوشهٔ چهارراه است، بین مسیر اصلی و مسیر کنار دریاچه، در سمتی که به دریاچه نزدیک‌تر است، یعنی H.",
              },
              evidence: "It's at the crossroads, in the corner between the main path and the lake path, on the side nearest the lake.",
            },
          ],
        },
        {
          id: "a1-l-g5",
          type: "matching",
          interaction: "grid",
          title: "Questions 18–20",
          instructions: "On which day does each activity now take place?\nChoose **THREE** answers from the box and write the correct letter, **A–E**, next to Questions 18–20.",
          optionsTitle: "Days",
          options: [
            { key: "A", text: "Monday" },
            { key: "B", text: "Tuesday" },
            { key: "C", text: "Thursday" },
            { key: "D", text: "Saturday" },
            { key: "E", text: "Sunday" },
          ],
          items: [
            {
              id: "a1-l-q18",
              numbers: [18],
              prompt: "Hedge laying",
              answer: ["B"],
              explanation: {
                en: "Hedge laying used to be on Saturdays but has moved to Tuesday mornings.",
                fa: "Hedge laying قبلاً شنبه‌ها بود، اما حالا به صبح‌های سه‌شنبه (Tuesday) منتقل شده است.",
              },
              trap: { en: "Distractor: the old day is mentioned", fa: "گزینهٔ انحرافی: روز قبلی هم گفته می‌شود" },
              evidence: "we've moved it to Tuesday mornings",
            },
            {
              id: "a1-l-q19",
              numbers: [19],
              prompt: "Bird survey",
              answer: ["E"],
              explanation: {
                en: "The bird survey is early on Sunday; Thursday was printed on the old leaflet and is wrong.",
                fa: "سرشماری پرندگان صبح زود یکشنبه (Sunday) است؛ پنجشنبه روی بروشور قدیمی چاپ شده و درست نیست.",
              },
              trap: { en: "Distractor: an out-of-date leaflet", fa: "گزینهٔ انحرافی: بروشور قدیمی" },
              evidence: "The bird survey is early on Sunday, I'm afraid, because that's when the reserve is quietest.",
            },
            {
              id: "a1-l-q20",
              numbers: [20],
              prompt: "Path repairs",
              answer: ["A"],
              explanation: {
                en: "Path repairs take place on Monday, after the weekend visitors.",
                fa: "تعمیر مسیرها دوشنبه (Monday)، بعد از رفتن بازدیدکنندگان آخر هفته، انجام می‌شود.",
              },
              trap: { en: "Distractor: \"weekend\" is heard in the same sentence", fa: "گزینهٔ انحرافی: کلمهٔ weekend در همان جمله شنیده می‌شود" },
              evidence: "are on Monday, after the weekend visitors have worn things down.",
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    /*  Part 3: students and tutor discuss a research project        */
    /* ------------------------------------------------------------ */
    {
      id: "a1-l-p3",
      number: 3,
      rubric: "Listen and answer questions 21–30.",
      audio: {
        src: "/audio/academic-1/listening-part-3.m4a",
        durationSec: 0,
        transcript: [
          { speaker: "Narrator", text: "Part 3. You will hear two students, Priya and Tom, talking to their tutor, Dr Hale, about their research project on plants in study rooms. First, you have some time to look at questions 21 to 26." },
          { speaker: "Narrator", text: "Now listen carefully and answer questions 21 to 26." },
          { speaker: "Dr Hale", text: "Come in, both of you. So, you ran your pilot study last week. How did it go?" },
          { speaker: "Priya", text: "Mostly well, but there were a couple of problems. The main one was the questionnaire. We'd included far too many questions, and people were losing interest halfway through." },
          { speaker: "Tom", text: "And the other thing was timing. We ran it in the second week of exams, so a lot of people were stressed and in a hurry to leave." },
          { speaker: "Dr Hale", text: "What about the room? I remember you were worried about noise from the corridor." },
          { speaker: "Priya", text: "We were, but actually it was fine. Nobody mentioned it. And every participant stayed until the end, which was a relief." },
          { speaker: "Tom", text: "The plants survived as well, though one of them was looking a bit sad by Friday." },
          { speaker: "Dr Hale", text: "Good. So what changes are you making for the main study?" },
          { speaker: "Tom", text: "Well, first, recruitment. We originally planned on sixty people, but that's more than we can manage, so we're aiming for forty, all from first-year classes." },
          { speaker: "Priya", text: "Then we'll split them between two identical rooms. One will have plants, and to make it a fair comparison, the other will have posters on the walls instead, so it isn't just a bare room." },
          { speaker: "Dr Hale", text: "Sensible. And the task itself?" },
          { speaker: "Tom", text: "We thought about a reading test, but marking that takes ages. So it'll be a memory test, twenty minutes long, done on laptops." },
          { speaker: "Priya", text: "And during each session we'll record the conditions in both rooms. The heating system logs the temperature automatically, so that's covered, but we'll measure the humidity every hour ourselves, because plants can change it." },
          { speaker: "Narrator", text: "Before you hear the rest of the discussion, you have some time to look at questions 27 to 30." },
          { speaker: "Narrator", text: "Now listen and answer questions 27 to 30." },
          { speaker: "Dr Hale", text: "There's some useful background reading you should look at. Not the well-known study on office furniture, which is rather dated, but a newer one on office lighting. It used a very similar method to yours." },
          { speaker: "Tom", text: "We'll look it up. We've also agreed how to divide the work. Priya's going to write the literature review, and I'll do the data analysis, since I've taken the statistics module." },
          { speaker: "Dr Hale", text: "And you know about the deadline? It was the twenty-eighth of February, but the department has extended it, so the final report is now due on the fourteenth of March." },
          { speaker: "Priya", text: "That gives us a bit more breathing space." },
          { speaker: "Dr Hale", text: "One last piece of advice. Examiners always look for a section on the limitations of the study. Students tend to hide them, but being honest about what your results can't show is a strength." },
          { speaker: "Tom", text: "That's really helpful. Thanks, Dr Hale." },
          { speaker: "Narrator", text: "That is the end of part 3." },
        ],
      },
      groups: [
        {
          id: "a1-l-g6",
          type: "multiple-choice",
          interaction: "multi",
          title: "Questions 21–22",
          instructions: "Choose **TWO** letters, **A–E**.",
          choose: 2,
          options: [
            { key: "A", text: "Some participants left before the end." },
            { key: "B", text: "The room was too noisy." },
            { key: "C", text: "The questionnaire was too long." },
            { key: "D", text: "Some of the plants died." },
            { key: "E", text: "It took place during the exam period." },
          ],
          items: [
            {
              id: "a1-l-q21-22",
              numbers: [21, 22],
              prompt: "Which TWO problems did the students have with their pilot study?",
              answer: ["C", "E"],
              explanation: {
                en: "Priya says the questionnaire had far too many questions, and Tom says it was run during exams. Noise, people leaving and dead plants are all ruled out.",
                fa: "پریا می‌گوید پرسشنامه سؤال‌های خیلی زیادی داشت و تام می‌گوید مطالعه در دورهٔ امتحانات انجام شد. سروصدا، رفتن شرکت‌کننده‌ها و خشک شدن گیاهان همه کنار گذاشته می‌شوند.",
              },
              trap: { en: "Distractor: B, A and D are each mentioned and rejected", fa: "گزینهٔ انحرافی: گزینه‌های B، A و D هر کدام گفته و بعد رد می‌شوند" },
              evidence: "We'd included far too many questions, and people were losing interest halfway through.",
            },
          ],
        },
        {
          id: "a1-l-g7",
          type: "flow-chart-completion",
          interaction: "gap",
          title: "Questions 23–26",
          instructions: "Complete the flow chart below.\nWrite **ONE WORD AND/OR A NUMBER** for each answer.",
          content: [
            { kind: "heading", text: "Procedure for the main study" },
            {
              kind: "flow",
              steps: [
                "Recruit {{23}} first-year students",
                "Divide them between two rooms: one with plants, one with {{24}}",
                "Participants complete a 20-minute {{25}} test on laptops",
                "Record the {{26}} in each room every hour",
              ],
            },
          ],
          items: [
            {
              id: "a1-l-q23",
              numbers: [23],
              answer: ["40", "forty"],
              explanation: {
                en: "They first planned on sixty people but are now aiming for forty.",
                fa: "اول قصد داشتند شصت نفر را بیاورند، اما حالا هدفشان چهل نفر (40) است.",
              },
              trap: { en: "Distractor: the original number is given first", fa: "گزینهٔ انحرافی: اول عدد اولیه گفته می‌شود" },
              evidence: "so we're aiming for forty, all from first-year classes.",
            },
            {
              id: "a1-l-q24",
              numbers: [24],
              answer: ["posters"],
              explanation: {
                en: "The second room will have posters on the walls instead of plants.",
                fa: "اتاق دوم به‌جای گیاه، پوستر (posters) روی دیوارهایش خواهد داشت.",
              },
              trap: { en: "Plural", fa: "جمع بودن کلمه" },
              evidence: "the other will have posters on the walls instead",
            },
            {
              id: "a1-l-q25",
              numbers: [25],
              answer: ["memory"],
              explanation: {
                en: "A reading test was considered but rejected; they will use a memory test.",
                fa: "آزمون خواندن را بررسی کردند ولی کنار گذاشتند؛ از آزمون حافظه (memory) استفاده می‌کنند.",
              },
              trap: { en: "Distractor: a reading test is mentioned first", fa: "گزینهٔ انحرافی: اول آزمون خواندن مطرح می‌شود" },
              evidence: "So it'll be a memory test, twenty minutes long, done on laptops.",
            },
            {
              id: "a1-l-q26",
              numbers: [26],
              answer: ["humidity"],
              explanation: {
                en: "Temperature is logged automatically, so the students themselves measure the humidity every hour.",
                fa: "دما به‌طور خودکار ثبت می‌شود، پس خود دانشجوها هر ساعت رطوبت (humidity) را اندازه می‌گیرند.",
              },
              trap: { en: "Distractor: temperature is mentioned first", fa: "گزینهٔ انحرافی: اول از دما صحبت می‌شود" },
              evidence: "but we'll measure the humidity every hour ourselves",
            },
          ],
        },
        {
          id: "a1-l-g8",
          type: "sentence-completion",
          interaction: "gap",
          title: "Questions 27–30",
          instructions: "Complete the sentences below.\nWrite **NO MORE THAN TWO WORDS AND/OR A NUMBER** for each answer.",
          content: [
            { kind: "paragraph", text: "Dr Hale recommends a recent study on office {{27}}." },
            { kind: "paragraph", text: "Tom will be responsible for the {{28}}." },
            { kind: "paragraph", text: "The final report must be handed in by {{29}}." },
            { kind: "paragraph", text: "The report should include a section on the {{30}} of the study." },
          ],
          items: [
            {
              id: "a1-l-q27",
              numbers: [27],
              answer: ["lighting"],
              explanation: {
                en: "The study on office furniture is described as dated; the one she recommends is on office lighting.",
                fa: "مطالعه دربارهٔ مبلمان اداری قدیمی توصیف می‌شود؛ مطالعه‌ای که توصیه می‌کند دربارهٔ نور اداری (lighting) است.",
              },
              trap: { en: "Distractor: office furniture", fa: "گزینهٔ انحرافی: مبلمان اداری" },
              evidence: "but a newer one on office lighting",
            },
            {
              id: "a1-l-q28",
              numbers: [28],
              answer: ["data analysis", "analysis"],
              explanation: {
                en: "Priya will write the literature review, and Tom will do the data analysis.",
                fa: "پریا مرور منابع را می‌نویسد و تام مسئول تحلیل داده‌ها (data analysis) است.",
              },
              trap: { en: "Distractor: the literature review is Priya's job", fa: "گزینهٔ انحرافی: مرور منابع کار پریاست، نه تام" },
              evidence: "and I'll do the data analysis",
            },
            {
              id: "a1-l-q29",
              numbers: [29],
              answer: ["14 March", "March 14", "14th March", "March 14th", "14 Mar", "14th of March"],
              explanation: {
                en: "The old deadline was 28 February, but it has been extended to 14 March.",
                fa: "مهلت قبلی 28 February بود، اما تمدید شده و حالا 14 March است.",
              },
              trap: { en: "Speaker corrects the date: the old deadline is given first", fa: "اصلاح تاریخ: اول مهلت قبلی گفته می‌شود" },
              evidence: "so the final report is now due on the fourteenth of March.",
            },
            {
              id: "a1-l-q30",
              numbers: [30],
              answer: ["limitations"],
              explanation: {
                en: "Dr Hale says examiners look for a section on the limitations of the study.",
                fa: "دکتر هیل می‌گوید ممتحن‌ها دنبال بخشی دربارهٔ محدودیت‌های (limitations) مطالعه هستند.",
              },
              trap: { en: "Plural", fa: "جمع بودن کلمه" },
              evidence: "Examiners always look for a section on the limitations of the study.",
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    /*  Part 4: lecture on lichens and air quality                   */
    /* ------------------------------------------------------------ */
    {
      id: "a1-l-p4",
      number: 4,
      rubric: "Listen and answer questions 31–40.",
      audio: {
        src: "/audio/academic-1/listening-part-4.m4a",
        durationSec: 0,
        transcript: [
          { speaker: "Narrator", text: "Part 4. You will hear a lecture about lichens and what they can tell us about air quality. First, you have some time to look at questions 31 to 40." },
          { speaker: "Narrator", text: "Now listen carefully and answer questions 31 to 40." },
          { speaker: "Dr Novak", text: "Good afternoon. Today I want to talk about some of the most overlooked organisms around us, lichens, and why scientists use them to judge the quality of the air we breathe." },
          { speaker: "Dr Novak", text: "You'll find them almost everywhere once you start looking: on tree trunks, garden walls, rooftops, even on old cars. Many of them look like little more than a crusty stain, which is why most people walk straight past." },
          { speaker: "Dr Novak", text: "A lichen is not a single organism. It's a partnership between a fungus and an alga. The fungus gives the alga shelter and holds on to moisture, while the alga uses sunlight to produce food for both of them." },
          { speaker: "Dr Novak", text: "Crucially, lichens have no roots. They take nothing from the bark or stone they grow on. Instead, they absorb water and nutrients straight from the atmosphere, along with anything else that happens to be in it." },
          { speaker: "Dr Novak", text: "That makes them very sensitive to pollution, especially sulphur dioxide. Traffic produces some of this gas, but historically the main source has been the burning of coal, in power stations and in people's homes." },
          { speaker: "Dr Novak", text: "So why use lichens rather than machines? Partly it's cost. A network of electronic sensors across a city is expensive to install and maintain, whereas lichens are already there, recording conditions all year round." },
          { speaker: "Dr Novak", text: "And because the common species are fairly easy to identify, surveys can be carried out by volunteers, including school children. That means far more places can be covered than a small research team could ever manage." },
          { speaker: "Dr Novak", text: "Now, over the last few decades, sulphur levels have fallen sharply in most European cities, and many sensitive lichens have come back. But a new pattern has appeared." },
          { speaker: "Dr Novak", text: "Some species are spreading very fast, and the reason is nitrogen, which comes from farm fertilisers and from vehicle exhausts." },
          { speaker: "Dr Novak", text: "So a city can have much cleaner air in one sense, and still show a clear signal of a quite different kind of pollution. Reading that signal is what our work is about." },
          { speaker: "Dr Novak", text: "Let me turn to our own project. We wanted surfaces whose age we knew exactly. We considered church walls and roofs, but their dates are often uncertain." },
          { speaker: "Dr Novak", text: "In the end we chose old gravestones, because the carved date tells you how long the lichen has had to grow." },
          { speaker: "Dr Novak", text: "We expected the sunny, south-facing sides to have the most species. In fact, the greatest variety was on the sides facing north, probably because they stay damp for longer." },
          { speaker: "Dr Novak", text: "We also found plenty of the nitrogen-loving species I mentioned. They're easy to spot, because while the sensitive species tend to be a pale grey-green, these are a vivid orange." },
          { speaker: "Dr Novak", text: "For next week's field trip, you won't need cameras, as we'll provide those. But do bring a compass, because you'll be recording which direction each surface faces. Phone apps aren't reliable enough for this." },
          { speaker: "Narrator", text: "That is the end of the Listening test. You now have two minutes to check your answers." },
        ],
      },
      groups: [
        {
          id: "a1-l-g9",
          type: "note-completion",
          interaction: "gap",
          title: "Questions 31–36",
          instructions: "Complete the notes below.\nWrite **ONE WORD ONLY** for each answer.",
          content: [
            { kind: "heading", text: "Lichens as indicators of air quality" },
            { kind: "heading", text: "Biology" },
            {
              kind: "list",
              items: [
                "a partnership between a fungus and an alga: the alga makes {{31}}",
                "no roots: water and nutrients are absorbed directly from the {{32}}",
              ],
            },
            { kind: "heading", text: "Use in monitoring" },
            {
              kind: "list",
              items: [
                "very sensitive to sulphur dioxide, mainly from burning {{33}}",
                "much cheaper than a network of electronic {{34}}",
                "common species are easy to identify, so surveys can use {{35}}",
              ],
            },
            { kind: "heading", text: "Recent changes" },
            {
              kind: "list",
              items: ["some species are spreading because of {{36}} from farms and vehicles"],
            },
          ],
          items: [
            {
              id: "a1-l-q31",
              numbers: [31],
              answer: ["food"],
              explanation: {
                en: "The fungus provides shelter and moisture; the alga uses sunlight to produce food.",
                fa: "قارچ سرپناه و رطوبت فراهم می‌کند؛ جلبک با نور خورشید غذا (food) می‌سازد.",
              },
              trap: { en: "Distractor: shelter and moisture come from the fungus", fa: "گزینهٔ انحرافی: سرپناه و رطوبت را قارچ فراهم می‌کند" },
              evidence: "while the alga uses sunlight to produce food for both of them.",
            },
            {
              id: "a1-l-q32",
              numbers: [32],
              answer: ["atmosphere", "air"],
              explanation: {
                en: "Lichens take nothing from the bark or stone; they absorb water and nutrients from the atmosphere.",
                fa: "گلسنگ‌ها چیزی از پوست درخت یا سنگ نمی‌گیرند؛ آب و مواد مغذی را مستقیم از جو (atmosphere) جذب می‌کنند.",
              },
              trap: { en: "Distractor: bark and stone", fa: "گزینهٔ انحرافی: پوست درخت و سنگ" },
              evidence: "they absorb water and nutrients straight from the atmosphere",
            },
            {
              id: "a1-l-q33",
              numbers: [33],
              answer: ["coal"],
              explanation: {
                en: "Traffic produces some sulphur dioxide, but the main source has been burning coal.",
                fa: "ترافیک مقداری دی‌اکسید گوگرد تولید می‌کند، اما منبع اصلی سوزاندن زغال‌سنگ (coal) بوده است.",
              },
              trap: { en: "Distractor: traffic", fa: "گزینهٔ انحرافی: ترافیک" },
              evidence: "but historically the main source has been the burning of coal",
            },
            {
              id: "a1-l-q34",
              numbers: [34],
              answer: ["sensors"],
              explanation: {
                en: "A network of electronic sensors is expensive, while lichens are already in place.",
                fa: "شبکه‌ای از حسگرهای الکترونیکی (sensors) گران است، در حالی که گلسنگ‌ها از قبل همه‌جا هستند.",
              },
              trap: { en: "Plural", fa: "جمع بودن کلمه" },
              evidence: "A network of electronic sensors across a city is expensive to install and maintain",
            },
            {
              id: "a1-l-q35",
              numbers: [35],
              answer: ["volunteers"],
              explanation: {
                en: "Because common species are easy to identify, volunteers, including school children, can carry out surveys.",
                fa: "چون شناسایی گونه‌های رایج آسان است، داوطلب‌ها (volunteers)، حتی دانش‌آموزان مدرسه، می‌توانند بررسی‌ها را انجام دهند.",
              },
              trap: { en: "Plural", fa: "جمع بودن کلمه" },
              evidence: "surveys can be carried out by volunteers, including school children",
            },
            {
              id: "a1-l-q36",
              numbers: [36],
              answer: ["nitrogen"],
              explanation: {
                en: "Sulphur levels have fallen; the new spread of some species is caused by nitrogen from fertilisers and exhausts.",
                fa: "میزان گوگرد کم شده است؛ گسترش جدید بعضی گونه‌ها به خاطر نیتروژن (nitrogen) حاصل از کود و دود خودروهاست.",
              },
              trap: { en: "Distractor: sulphur", fa: "گزینهٔ انحرافی: گوگرد" },
              evidence: "and the reason is nitrogen, which comes from farm fertilisers and from vehicle exhausts.",
            },
          ],
        },
        {
          id: "a1-l-g10",
          type: "summary-completion",
          interaction: "gap",
          title: "Questions 37–38",
          instructions: "Complete the summary below.\nWrite **ONE WORD ONLY** for each answer.",
          content: [
            { kind: "heading", text: "The lecturer's own project" },
            {
              kind: "paragraph",
              text: "The team needed surfaces of a known age, so they recorded the lichens growing on old {{37}}. They expected the greatest variety of species on sunny surfaces, but most species were found on surfaces facing {{38}}, which probably stay damp for longer.",
            },
          ],
          items: [
            {
              id: "a1-l-q37",
              numbers: [37],
              answer: ["gravestones"],
              explanation: {
                en: "Church walls and roofs were rejected because their dates are uncertain; gravestones carry a carved date.",
                fa: "دیوار و سقف کلیسا رد شدند چون تاریخ ساختشان معلوم نیست؛ سنگ قبرها (gravestones) تاریخ حک‌شده دارند.",
              },
              trap: { en: "Distractor: church walls and roofs; plural", fa: "گزینهٔ انحرافی: دیوار و سقف کلیسا؛ همچنین جمع بودن کلمه" },
              evidence: "In the end we chose old gravestones",
            },
            {
              id: "a1-l-q38",
              numbers: [38],
              answer: ["north"],
              explanation: {
                en: "They expected south-facing sides to be richest, but the greatest variety was on north-facing sides.",
                fa: "انتظار داشتند سمت‌های رو به جنوب بیشترین تنوع را داشته باشند، اما بیشترین تنوع در سمت‌های رو به شمال (north) بود.",
              },
              trap: { en: "Distractor: the expected result (south)", fa: "گزینهٔ انحرافی: نتیجهٔ مورد انتظار (جنوب)" },
              evidence: "In fact, the greatest variety was on the sides facing north",
            },
          ],
        },
        {
          id: "a1-l-g11",
          type: "short-answer",
          interaction: "gap",
          title: "Questions 39–40",
          instructions: "Answer the questions below.\nWrite **ONE WORD ONLY** for each answer.",
          content: [
            { kind: "paragraph", text: "What colour are the nitrogen-loving lichens? {{39}}" },
            { kind: "paragraph", text: "What should students bring on the field trip? {{40}}" },
          ],
          items: [
            {
              id: "a1-l-q39",
              numbers: [39],
              answer: ["orange"],
              explanation: {
                en: "Sensitive species are pale grey-green, while the nitrogen-loving ones are vivid orange.",
                fa: "گونه‌های حساس سبز مایل به خاکستری کم‌رنگ هستند، اما گونه‌های نیتروژن‌دوست نارنجی (orange) پررنگ‌اند.",
              },
              trap: { en: "Distractor: the colour of the sensitive species", fa: "گزینهٔ انحرافی: رنگ گونه‌های حساس" },
              evidence: "these are a vivid orange",
            },
            {
              id: "a1-l-q40",
              numbers: [40],
              answer: ["compass"],
              explanation: {
                en: "Cameras will be provided, but students must bring a compass to record which way each surface faces.",
                fa: "دوربین را خود دانشگاه می‌دهد، اما دانشجوها باید قطب‌نما (compass) بیاورند تا جهت هر سطح را ثبت کنند.",
              },
              trap: { en: "Distractor: cameras and phone apps", fa: "گزینهٔ انحرافی: دوربین و اپلیکیشن‌های گوشی" },
              evidence: "But do bring a compass",
            },
          ],
        },
      ],
    },
  ],
};

/** Voice per speaker name used in transcripts; macOS `say` voices. */
export const listeningVoices: Record<string, string> = {
  Narrator: "bm_george",
  // Part 1: caller and receptionist
  Joanne: "af_bella",
  Martin: "bm_lewis",
  // Part 2: site guide
  Fiona: "bf_isabella",
  // Part 3: two students and their tutor
  Priya: "bf_emma",
  Tom: "bm_fable",
  "Dr Hale": "bf_alice",
  // Part 4: American lecturer
  "Dr Novak": "af_heart",
};
