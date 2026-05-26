#!/usr/bin/env node

/**
 * The Professor — Programmatic SEO Page Generator
 * 
 * Reads keyword-map.json and generates structured markdown study pages
 * with genuinely educational content in The Professor's voice.
 * 
 * Usage:
 *   node growth/seo/page-generator.js                        # Generate all pages
 *   node growth/seo/page-generator.js --subject Biology       # Biology only
 *   node growth/seo/page-generator.js --slug what-is-osmosis  # Single page
 */

const fs = require('fs');
const path = require('path');

// ─── CLI Parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

const filterSubject = getFlag('subject');
const filterSlug = getFlag('slug');

// ─── Paths ───────────────────────────────────────────────────────────────────

const SCRIPT_DIR = __dirname;
const KEYWORD_MAP_PATH = path.join(SCRIPT_DIR, 'keyword-map.json');
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'pages');

// ─── Content Templates ──────────────────────────────────────────────────────
// Each key is the slug from keyword-map.json.
// Every concept has: title, breakdown, examRelevance, commonTrap, questions, subject

const CONTENT_TEMPLATES = {

  // ═══════════════════════════════════════════════════════════════════════════
  //  BIOLOGY (10)
  // ═══════════════════════════════════════════════════════════════════════════

  'what-is-osmosis-in-biology': {
    title: 'What is Osmosis (And Why Your Lecturer Keeps Testing It)',
    breakdown: `Okay so picture this. You have a cup of really salty water on one side of a thin membrane, and pure water on the other side. What happens? The pure water moves toward the salty side — all by itself. That's osmosis. It's the movement of water molecules from a region of higher water concentration (or lower solute concentration) to a region of lower water concentration (or higher solute concentration) through a semi-permeable membrane.

The membrane is the key player here. It's picky — it lets water through but blocks the bigger dissolved stuff like salt or sugar. Think of it like a bouncer at a club who only lets certain people in. Your cell membranes work exactly this way. This is how your cells stay hydrated, how plant roots absorb water from the soil, and why putting salt on a slug is genuinely cruel (the water literally leaves its body). When a cell is placed in pure water, water rushes in and the cell swells. In a very salty solution, water rushes out and the cell shrinks. In biology, we call these hypotonic, hypertonic, and isotonic solutions — and yes, WAEC will ask you about all three.`,
    examRelevance: `WAEC and JAMB absolutely love osmosis. It shows up almost every single year, either as an objective question or as part of a practical scenario. You'll usually be asked to explain what happens when a cell is placed in different concentrations of solution, or to describe an experiment demonstrating osmosis (the classic visking tubing or potato strip experiment). NECO often tests the difference between osmosis and diffusion, so make sure you're clear: osmosis is specifically about water through a semi-permeable membrane. Diffusion is about any molecule moving from high to low concentration. JAMB likes to throw in questions about plasmolysis (when a plant cell loses so much water that the cell membrane pulls away from the cell wall). Know that term. It's free marks.`,
    commonTrap: `Here's where most students slip up: they say osmosis is "the movement of molecules from a region of high concentration to low concentration." That's diffusion, not osmosis. Osmosis is specifically about WATER molecules moving through a SEMI-PERMEABLE MEMBRANE. Miss either of those two details and you lose marks. Another common mistake is confusing turgid with flaccid. A turgid cell is full of water (firm, like a fresh tomato). A flaccid cell has lost water (limp, like that tomato you forgot in the fridge for two weeks). And remember — animal cells burst (lyse) in pure water because they don't have a cell wall. Plant cells don't burst because the cell wall holds them together. That distinction is worth marks.`,
    questions: [
      'Explain what would happen if you placed red blood cells in distilled water, and why this is different from what happens to plant cells in the same solution.',
      'A student sets up an experiment with visking tubing filled with sugar solution and places it in a beaker of water. After 30 minutes, the tubing is firm and swollen. Explain what happened in terms of osmosis.',
      'Why is it important for hospital IV drips to use isotonic saline solution instead of pure water? Explain using your knowledge of osmosis.'
    ]
  },

  'difference-between-mitosis-and-meiosis': {
    title: 'Mitosis vs Meiosis — The Cell Division Cheat Sheet You Actually Need',
    breakdown: `Your body needs new cells all the time — for growth, repair, replacing dead skin, healing wounds. That's mitosis. It takes one cell and makes two identical copies. Same number of chromosomes, same genetic information, same everything. It's like photocopying a document — you get an exact duplicate. In humans, the original cell has 46 chromosomes and each new cell also has 46. Simple.

Meiosis is different. It's specifically for making sex cells — sperm and egg cells (gametes). Instead of two identical cells, meiosis gives you four cells, each with HALF the number of chromosomes (23 in humans). This is crucial because when sperm meets egg during fertilization, you need 23 + 23 = 46. If sex cells had the full 46 chromosomes, every new generation would keep doubling. Meiosis also does something sneaky called crossing over, where chromosomes swap little bits of DNA. This is why siblings from the same parents look different from each other — genetic variation. Mitosis gives you clones. Meiosis gives you variety. Both involve prophase, metaphase, anaphase, and telophase — but meiosis does it twice (meiosis I and meiosis II).`,
    examRelevance: `This is one of those topics where JAMB loves a comparison table. You will almost certainly see a question asking you to "state five differences between mitosis and meiosis." WAEC often sets it as a structured essay question worth 8-10 marks. The key things they test: number of daughter cells (2 vs 4), chromosome number (diploid vs haploid), where it occurs (somatic cells vs reproductive organs), genetic outcome (identical vs genetically different), and whether crossing over happens (no vs yes). NECO has been known to ask about the significance of each type of cell division — growth and repair for mitosis, genetic variation for meiosis. Draw the comparison table once, memorize it, and you'll see it pay off across all three exams.`,
    commonTrap: `The biggest mistake? Students mix up which division halves the chromosomes. It's meiosis I that does the reduction (from diploid to haploid). Meiosis II is actually quite similar to mitosis — it just separates the sister chromatids. Another trap: students say meiosis produces "four identical cells." No. The whole point of meiosis is that the four cells are genetically DIFFERENT because of crossing over and independent assortment. Also, don't say mitosis happens "everywhere in the body." It doesn't happen in mature nerve cells or mature red blood cells. WAEC has caught students on this specific detail before.`,
    questions: [
      'If a cell with 12 chromosomes undergoes meiosis, how many chromosomes will each daughter cell have? What about if the same cell underwent mitosis?',
      'Explain why meiosis is important for maintaining a constant chromosome number across generations in a species.',
      'A student says "mitosis and meiosis both produce genetically identical cells." Identify the error in this statement and correct it.'
    ]
  },

  'explain-the-process-of-photosynthesis': {
    title: 'Photosynthesis — How Plants Actually Make Their Food (No Textbook Waffle)',
    breakdown: `Plants don't eat. Let that sink in. They make their own food using sunlight, water, and carbon dioxide. That process is photosynthesis, and the equation is: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (with light energy and chlorophyll). In plain English: carbon dioxide plus water, powered by sunlight, produces glucose and oxygen.

It happens in two main stages. The light-dependent reactions happen in the thylakoid membranes of the chloroplast. This is where chlorophyll absorbs light energy and uses it to split water molecules (photolysis). That splitting releases oxygen (which the plant doesn't need, so it lets it go — you're welcome, lungs) and produces ATP and NADPH, which are basically energy currency. The second stage is the Calvin cycle (light-independent reactions), which happens in the stroma. Here, the plant uses that ATP and NADPH to fix carbon dioxide into glucose. So the light reactions capture energy, and the Calvin cycle uses that energy to build sugar. The whole thing happens in the chloroplast, which is why only green parts of a plant photosynthesize — they're the parts with chlorophyll.`,
    examRelevance: `Photosynthesis is WAEC bread and butter. They test it almost every year, either as the equation, the process, or the factors affecting it (light intensity, CO₂ concentration, temperature). JAMB loves asking about the products of the light and dark reactions separately. A common UTME question format: "Which of the following is produced during the light-dependent stage of photosynthesis?" (Answer: oxygen, ATP, NADPH). NECO often asks you to draw and label the chloroplast, or to describe an experiment to show that light/CO₂/chlorophyll is needed for photosynthesis. The classic experiment with destarched leaves, iodine test, and aluminum foil is a perennial favorite. If you know that experiment cold, you're set.`,
    commonTrap: `Students often say photosynthesis happens "in the leaves." That's too vague. It happens specifically in the chloroplasts, within cells that contain chlorophyll. Not all leaf cells have chloroplasts (like epidermal cells, which are usually transparent). Another common error: mixing up the products of light-dependent vs light-independent reactions. Light stage = O₂, ATP, NADPH. Dark stage (Calvin cycle) = glucose. Also, the "dark reactions" don't need darkness — they just don't directly need light. They can happen in the light too. WAEC has used this as a trick option before. And don't forget: plants also respire. They photosynthesize AND respire. Photosynthesis doesn't replace respiration.`,
    questions: [
      'Explain why a plant that is kept in darkness for 48 hours would test negative for starch in its leaves. What does this tell you about photosynthesis?',
      'Describe an experiment you would carry out to prove that carbon dioxide is necessary for photosynthesis.',
      'A student says "the oxygen we breathe comes from carbon dioxide during photosynthesis." Is this correct? Explain where the oxygen actually comes from.'
    ]
  },

  'aerobic-and-anaerobic-respiration-explained': {
    title: 'Cellular Respiration — Your Cells Are Literally Breathing Right Now',
    breakdown: `Every single cell in your body needs energy to survive. Respiration is how cells break down glucose to release that energy, stored as ATP (adenosine triphosphate). It's not the same as breathing — breathing is just how you get oxygen into your lungs. Respiration is the chemical process that happens inside your cells.

Aerobic respiration needs oxygen. The equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy (ATP). It happens in three stages: glycolysis (in the cytoplasm, breaks glucose into pyruvate), the Krebs cycle (in the mitochondrial matrix), and the electron transport chain (on the inner mitochondrial membrane). Aerobic respiration produces about 38 ATP per glucose molecule. That's efficient. Anaerobic respiration happens without oxygen. In animals, glucose breaks down into lactic acid (that burning feeling in your muscles during intense exercise). In yeast and plants, it produces ethanol and CO₂ — that's literally how bread rises and beer is made. Anaerobic respiration only produces 2 ATP per glucose. Way less efficient, but it's fast and works when oxygen is scarce.`,
    examRelevance: `WAEC consistently tests the difference between aerobic and anaerobic respiration. Expect comparison questions: "Tabulate three differences between aerobic and anaerobic respiration." JAMB loves asking about the specific stages — especially where each stage occurs (cytoplasm vs mitochondria). A classic JAMB question: "Glycolysis occurs in the ___" (Answer: cytoplasm). NECO often asks about practical applications — why athletes experience muscle cramps (lactic acid buildup from anaerobic respiration during intense exercise), or why yeast is used in baking (CO₂ from anaerobic respiration makes bread rise). Know the equations for both types cold. Also know that respiration happens in ALL living cells, 24/7 — not just when you're exercising.`,
    commonTrap: `The number one mistake: confusing respiration with breathing. Breathing (ventilation) is mechanical — air in, air out. Respiration is a chemical process in cells. They're related but not the same thing. Another trap: students say "anaerobic respiration produces no energy." Wrong. It produces 2 ATP per glucose — it's just way less than the 38 from aerobic. Also, many students forget that aerobic respiration produces water as well as CO₂. That metabolic water is actually significant — some desert animals survive partly on water produced by respiration. Finally, don't say glycolysis needs oxygen. Glycolysis is the first step in BOTH aerobic and anaerobic respiration and happens in the cytoplasm without oxygen.`,
    questions: [
      'Explain why a sprinter might experience muscle cramps during a 100m race but a marathon runner paces themselves to avoid it. Relate your answer to types of respiration.',
      'If you sealed a germinating seed in a flask with lime water, what would you observe after a few hours and why?',
      'A student claims "only animals carry out respiration." Explain why this statement is incorrect.'
    ]
  },

  'how-does-dna-replication-work': {
    title: "DNA Replication — How Your Body Copies Itself (Without Losing the Plot)",
    breakdown: `Before any cell divides, it needs to make an exact copy of its DNA. That's DNA replication. Think of it like this: your DNA is a twisted ladder (the double helix). To copy it, the cell first unzips the ladder down the middle. An enzyme called helicase does the unzipping by breaking the hydrogen bonds between the base pairs. Now you have two single strands, each one acting as a template.

Then another enzyme called DNA polymerase comes along and starts adding new complementary bases to each strand. Adenine pairs with Thymine (A-T), and Guanine pairs with Cytosine (G-C). Always. No exceptions. This is complementary base pairing, and it's the reason the copy is accurate. Each original strand gets a brand new partner, so you end up with two identical DNA molecules, each containing one old strand and one new strand. This is called semi-conservative replication — "semi" because half of each new molecule is conserved from the original. The whole process happens during the S phase of interphase, before mitosis or meiosis begins. It's incredibly fast and remarkably accurate, though occasional errors (mutations) do slip through.`,
    examRelevance: `JAMB and WAEC test DNA replication as part of the broader genetics topic. Common question formats: "Describe the process of DNA replication" (structured essay, WAEC), or "The enzyme responsible for unwinding the DNA double helix is ___" (objective, JAMB — answer: helicase). UTME likes testing complementary base pairing: "If one strand reads ATCGGA, what is the complementary strand?" (Answer: TAGCCT). WAEC also asks about the significance of DNA replication — why is it important? (Answer: ensures genetic continuity, every new cell gets the same genetic information). Know the three key enzymes: helicase (unwinds), DNA polymerase (adds bases), and ligase (joins fragments). That trio shows up in exams regularly.`,
    commonTrap: `The most common mistake is writing the wrong base pair. Remember: A pairs with T (in DNA), G pairs with C. Students sometimes accidentally pair A with G or mix up the rules for RNA (where A pairs with U, not T). Another trap: saying DNA replication is "conservative" instead of "semi-conservative." Conservative would mean one molecule keeps both original strands and the other is entirely new — that's not what happens. Semi-conservative means each new molecule has one old and one new strand. Meselson and Stahl proved this experimentally, and WAEC has asked about their experiment. Also, don't confuse replication (DNA → DNA) with transcription (DNA → RNA). They're different processes.`,
    questions: [
      'If a DNA strand reads 5\'-ATCGGCTAA-3\', write the complementary strand and indicate its direction.',
      'Explain what "semi-conservative replication" means and describe one piece of evidence that supports this model.',
      'What would happen if DNA polymerase made frequent errors during replication? Discuss the biological consequences.'
    ]
  },

  'food-chain-and-food-web-in-ecology': {
    title: "Food Chains and Webs — Who's Eating Who in Your Ecosystem",
    breakdown: `A food chain is simply a list of who eats whom in an ecosystem, written in order. Grass → Grasshopper → Lizard → Hawk. The arrow means "is eaten by." Grass is the producer (it makes its own food via photosynthesis). Grasshopper is the primary consumer (herbivore). Lizard is the secondary consumer. Hawk is the tertiary consumer. Each level is called a trophic level.

But in real life, organisms don't eat just one thing. A lizard eats grasshoppers, beetles, flies, and more. A hawk eats lizards, mice, snakes, and smaller birds. When you connect all the food chains in an ecosystem together, you get a food web — a more realistic picture of who's connected to whom. Energy flows through these chains, but here's the catch: only about 10% of energy transfers from one trophic level to the next. The rest is lost as heat through respiration. That's why there are always fewer top predators than producers — there simply isn't enough energy to support more of them. This also explains why food chains rarely have more than four or five links. The energy just runs out.`,
    examRelevance: `WAEC and JAMB test ecology heavily, and food chains/webs are the foundation. You'll be asked to construct food chains from given organisms, identify trophic levels, or explain energy flow. A classic JAMB question: "In the food chain: Grass → Rabbit → Fox → Decomposer, the rabbit is a ___" (Answer: primary consumer). WAEC loves asking about the 10% energy transfer rule and why pyramids of energy are always upright. NECO often asks what would happen if one organism in a food web was removed — testing your understanding of interdependence. Know the terms: producer, primary/secondary/tertiary consumer, decomposer, trophic level, pyramid of numbers, pyramid of energy, pyramid of biomass. That vocabulary alone is worth several marks.`,
    commonTrap: `Students often draw food chain arrows the wrong way. The arrow means "is eaten by" or "energy flows to." So it goes FROM the organism being eaten TO the one eating it. Grass → Rabbit (grass is eaten by rabbit), NOT Rabbit → Grass. Another mistake: saying "the sun is the first trophic level." The sun is the energy source, but it's not a trophic level. Producers (plants) are the first trophic level. Also, pyramids of numbers can be inverted (one tree supporting thousands of insects), but pyramids of energy are NEVER inverted. WAEC has tested this distinction specifically. Don't mix them up.`,
    questions: [
      'Given these organisms — Eagle, Grass, Snake, Grasshopper, Frog — arrange them into a food chain and identify the trophic level of each organism.',
      'Explain why a food web provides a more accurate representation of feeding relationships in an ecosystem than a single food chain.',
      'If all the secondary consumers in an ecosystem were suddenly removed, predict and explain what would happen to the populations of primary consumers and tertiary consumers.'
    ]
  },

  'how-enzymes-work-in-the-body': {
    title: 'Enzymes — The Tiny Workers That Run Your Entire Body',
    breakdown: `Enzymes are biological catalysts — they speed up chemical reactions in your body without being used up. Without enzymes, the reactions that keep you alive would take way too long. Digestion, DNA replication, muscle contraction — enzymes are behind all of it. They're proteins, which means they're made of amino acids folded into specific 3D shapes.

The most important part of an enzyme is its active site — a small pocket or groove with a very specific shape. The substance the enzyme works on is called the substrate. The substrate fits into the active site like a key fits into a lock (that's the lock and key model). Once the substrate binds, the enzyme does its thing — breaking it down or joining it with something else — and then releases the product. The enzyme is unchanged and ready to go again. Temperature and pH affect enzyme activity. Each enzyme has an optimal temperature and pH where it works best. Go too high on temperature and the enzyme denatures — its shape changes permanently and the substrate can no longer fit. That's why high fevers are dangerous — they start denaturing your body's enzymes. Most human enzymes work best around 37°C. Pepsin (in your stomach) works best at pH 2, while amylase (in your mouth) prefers pH 7.`,
    examRelevance: `Enzymes are a WAEC and JAMB favorite. The practical exam often involves enzyme experiments — typically amylase breaking down starch (tested with iodine solution) or catalase decomposing hydrogen peroxide. Know the experimental procedures cold. In the theory paper, you'll be asked to explain the lock and key model, factors affecting enzyme action, or to draw and interpret graphs showing the effect of temperature or pH on enzyme activity. JAMB likes asking: "What happens to an enzyme at very high temperatures?" (Answer: it denatures — its active site changes shape). WAEC often asks you to explain why boiled enzyme solution shows no activity — because boiling permanently denatures the enzyme. The enzyme-substrate complex concept and the term "specificity" come up in almost every exam cycle.`,
    commonTrap: `The most common mistake: saying an enzyme is "killed" at high temperatures. Enzymes are not alive — they're proteins. The correct term is "denatured." When an enzyme denatures, its active site changes shape so the substrate can no longer fit. This is usually irreversible. Another trap: students say enzymes "die" at low temperatures. At low temperatures, enzymes aren't destroyed — they just slow down because molecules have less kinetic energy, so collisions between enzyme and substrate are less frequent. If you warm them back up, they work again. Also, don't say "enzymes are used up in reactions." The whole point of being a catalyst is that the enzyme is reusable. It comes out of the reaction unchanged.`,
    questions: [
      'Using the lock and key model, explain why amylase can break down starch but cannot break down protein.',
      'A student heats an enzyme solution to 80°C and then cools it back to 37°C. They find the enzyme no longer works. Explain why cooling it down didn\'t restore its activity.',
      'Describe an experiment to investigate the effect of temperature on the activity of the enzyme catalase. Include your expected results.'
    ]
  },

  'blood-circulation-in-humans': {
    title: 'Blood Circulation — Following Your Blood on a Round Trip Through Your Body',
    breakdown: `Your heart is a pump. It beats about 100,000 times a day, pushing blood through a network of blood vessels that, if stretched out, would wrap around the Earth more than twice. Humans have a double circulatory system, meaning blood passes through the heart twice on each complete loop. The right side of the heart pumps deoxygenated blood to the lungs (pulmonary circulation). The left side pumps oxygenated blood to the rest of the body (systemic circulation).

Here's the journey: deoxygenated blood enters the right atrium through the vena cava, moves to the right ventricle, and gets pumped to the lungs via the pulmonary artery. In the lungs, it picks up oxygen and drops off carbon dioxide. Now oxygenated, it returns to the left atrium through the pulmonary vein, moves to the left ventricle (the strongest chamber — it has the thickest wall because it pumps blood the farthest), and gets blasted out through the aorta to the entire body. Arteries carry blood away from the heart (thick walls, high pressure). Veins carry blood back to the heart (thinner walls, valves to prevent backflow). Capillaries are the tiny connectors where exchange actually happens — oxygen, nutrients, and waste products move between blood and tissues.`,
    examRelevance: `WAEC loves the heart diagram. You will almost certainly need to draw and label the heart at some point in your exam career — four chambers, major blood vessels, valves, direction of blood flow. JAMB tests the function of each chamber and blood vessel: "Which blood vessel carries oxygenated blood from the lungs to the heart?" (Answer: pulmonary vein — and yes, it's a vein carrying oxygenated blood, which confuses people). NECO asks about the difference between arteries, veins, and capillaries — typically in a comparison table. Know why the left ventricle wall is thicker than the right (it pumps blood to the entire body vs just the lungs). Know the function of valves (prevent backflow of blood). These details are consistent mark-earners.`,
    commonTrap: `The biggest trap: assuming arteries always carry oxygenated blood and veins always carry deoxygenated blood. That's true for most of the body, but the pulmonary artery carries DEOXYGENATED blood (from heart to lungs), and the pulmonary vein carries OXYGENATED blood (from lungs to heart). The rule is: arteries carry blood AWAY from the heart, veins carry blood TOWARD the heart. Not about oxygen content. Another common mistake: mixing up the left and right sides of the heart in diagrams. In diagrams, the right side of the heart appears on YOUR left (because you're looking at the heart as if the person is facing you). Finally, students forget that the heart has its own blood supply — the coronary arteries. A blockage here causes a heart attack.`,
    questions: [
      'Trace the path of a red blood cell from the right atrium to the aorta, naming every structure it passes through in order.',
      'Explain why the wall of the left ventricle is thicker than the wall of the right ventricle. What would happen if they were the same thickness?',
      'A doctor finds that a patient\'s veins have damaged valves. Explain what symptoms this might cause and why, using your knowledge of blood circulation.'
    ]
  },

  'how-the-nervous-system-works': {
    title: 'The Nervous System — How Your Brain Talks to Your Toes',
    breakdown: `Your nervous system is your body's communication network. It detects changes in your environment (stimuli), processes the information, and coordinates a response. It's split into two main parts: the central nervous system (CNS) — your brain and spinal cord — and the peripheral nervous system (PNS) — all the nerves branching out to the rest of your body.

The basic unit is the neuron (nerve cell). There are three types: sensory neurons (carry signals from receptors to the CNS), motor neurons (carry signals from the CNS to effectors like muscles or glands), and relay neurons (connect sensory and motor neurons inside the CNS). A signal travels along a neuron as an electrical impulse. When it reaches the end of one neuron, it needs to cross a tiny gap called a synapse to reach the next neuron. It does this chemically — the first neuron releases neurotransmitters into the gap, these chemicals cross over and trigger an electrical impulse in the next neuron. The simplest nervous pathway is a reflex arc: stimulus → receptor → sensory neuron → relay neuron (in spinal cord) → motor neuron → effector → response. Reflexes are fast and automatic — you pull your hand off a hot pot before you even feel the pain. That's the reflex arc bypassing your brain to save time.`,
    examRelevance: `WAEC tests the nervous system almost every year. The reflex arc diagram is a perennial favorite — expect to draw or label one. JAMB commonly asks: "The part of the nervous system responsible for reflex actions is the ___" (Answer: spinal cord). They also test neuron structure — know the cell body, axon, dendrites, myelin sheath, and synapse. NECO likes questions about voluntary vs involuntary actions and the difference between the somatic and autonomic nervous systems. WAEC essay questions often ask you to trace the pathway of a nervous impulse from stimulus to response, or to explain how a synapse works. The chemical transmission at synapses (neurotransmitter release, diffusion across the synaptic cleft, binding to receptors on the post-synaptic membrane) is a high-mark topic. Know it step by step.`,
    commonTrap: `Students often confuse nerves with neurons. A neuron is a single nerve cell. A nerve is a bundle of many neurons wrapped together — like how a cable contains many wires. Another mistake: saying reflexes involve the brain. Most reflexes are coordinated by the spinal cord — that's what makes them so fast. The brain is informed afterwards, which is why you feel the pain after you've already pulled your hand away. Also, don't say "electricity travels through nerves." The nerve impulse is electrochemical — it's electrical along the neuron but chemical at the synapse. And remember: neurotransmitters travel in one direction only (pre-synaptic to post-synaptic), which is why nerve impulses travel in one direction. WAEC has tested this.`,
    questions: [
      'Draw and label a simple reflex arc for the withdrawal of a hand from a hot object. Include all five components.',
      'Explain why reflex actions are faster than voluntary actions. Why is this speed important for survival?',
      'Describe the process by which a nerve impulse crosses a synapse. Why is this chemical rather than electrical?'
    ]
  },

  'excretion-in-humans-biology': {
    title: "Excretion — How Your Body Takes Out the Trash (It's More Interesting Than It Sounds)",
    breakdown: `Excretion is the removal of metabolic waste products from the body. These are waste substances produced by chemical reactions inside your cells. The key excretory organs are the kidneys (remove urea, excess water, and salts as urine), the lungs (remove carbon dioxide and water vapor), the skin (removes some water, salts, and urea through sweat), and the liver (which doesn't excrete directly but processes toxins and breaks down amino acids into urea in a process called deamination).

The kidneys are the stars of excretion. Each kidney contains about one million tiny filtering units called nephrons. Blood enters the kidney through the renal artery. In the nephron, the process goes like this: ultrafiltration (blood is filtered under high pressure in the Bowman's capsule — small molecules like water, glucose, urea, and salts pass through, but large molecules like proteins and blood cells stay in the blood), then selective reabsorption (useful substances like glucose, amino acids, and most of the water are reabsorbed back into the blood in the proximal convoluted tubule and loop of Henle), and finally, what's left — urea, excess water, excess salts — continues as urine through the collecting duct to the ureter, then to the bladder, and eventually out.`,
    examRelevance: `WAEC frequently tests the structure and function of the nephron — drawing and labeling it is almost guaranteed at some point. JAMB asks about the specific parts: "Where does ultrafiltration occur in the nephron?" (Answer: Bowman's capsule/glomerulus). "Where does selective reabsorption mainly occur?" (Answer: proximal convoluted tubule). NECO likes asking about the composition of urine vs blood plasma vs glomerular filtrate — essentially testing what gets filtered out and what gets reabsorbed. A common essay question: "Describe the process of urine formation in the mammalian kidney." Structure your answer around the three stages: ultrafiltration, selective reabsorption, and tubular secretion. Know the role of ADH (antidiuretic hormone) in controlling water reabsorption — this links excretion to osmoregulation, and WAEC loves cross-topic questions.`,
    commonTrap: `The most common mistake: confusing excretion with egestion. Excretion is the removal of metabolic waste (produced by cell reactions). Egestion is the removal of undigested food (faeces). Faeces is NOT excretory waste because it was never part of the body's metabolism — it just passed through the gut without being absorbed. This distinction is worth marks on nearly every exam. Another trap: saying "the kidney removes all waste from blood." The kidney specifically handles nitrogenous waste (urea), excess water, and excess salts. Carbon dioxide is excreted by the lungs. Don't mix up the excretory organs and what each removes. Also, students forget that glucose is normally fully reabsorbed — glucose in urine is actually a sign of diabetes, not normal excretion.`,
    questions: [
      'Clearly distinguish between excretion and egestion, giving one example of each. Explain why faeces is not considered an excretory product.',
      'Describe the three main stages of urine formation in the nephron. For each stage, state where it occurs and what happens.',
      'Explain why a person who drinks a large volume of water produces more dilute urine. Include the role of ADH in your answer.'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CHEMISTRY (10)
  // ═══════════════════════════════════════════════════════════════════════════

  'atomic-structure-and-electron-configuration': {
    title: "Atomic Structure — What's Actually Inside an Atom (Spoiler: Mostly Empty Space)",
    breakdown: `Everything around you — your phone, the air, your body — is made of atoms. An atom has three subatomic particles: protons (positive charge, in the nucleus), neutrons (no charge, also in the nucleus), and electrons (negative charge, orbiting the nucleus in energy levels/shells). The atomic number is the number of protons and it defines what element an atom is. Carbon always has 6 protons. Oxygen always has 8. Change the proton count, you change the element.

Electron configuration is how electrons are arranged around the nucleus. Electrons fill energy levels from the closest to the nucleus outward. The first shell holds a maximum of 2 electrons, the second holds 8, and the third holds 8 (for the elements you need to know for WAEC). So sodium (atomic number 11) has an electron configuration of 2, 8, 1. That outermost electron determines sodium's chemistry — it's the one sodium wants to give away, which is why sodium is so reactive. The number of electrons in the outermost shell (valence electrons) determines the element's group in the periodic table and how it bonds with other elements. Isotopes are atoms of the same element with different numbers of neutrons — same proton count, different mass number. Carbon-12 and Carbon-14 are isotopes of carbon.`,
    examRelevance: `WAEC and JAMB test atomic structure almost every year. You'll need to write electron configurations, identify elements from their atomic numbers, and calculate numbers of protons/neutrons/electrons from atomic and mass numbers. JAMB loves: "An element has atomic number 12 and mass number 24. How many neutrons does it have?" (Answer: 24 - 12 = 12 neutrons). WAEC asks about isotopes and their uses (Carbon-14 for dating, Cobalt-60 for medical treatment). NECO tests the arrangement of electrons in shells and how it relates to reactivity and bonding. Know how to draw the electronic structure of elements 1-20. It's a foundational skill that connects to chemical bonding, the periodic table, and reactions.`,
    commonTrap: `Students often confuse atomic number with mass number. Atomic number = number of protons only. Mass number = protons + neutrons. Another mistake: saying "electrons orbit the nucleus like planets orbit the sun." That's the old Bohr model and while it's useful for WAEC-level understanding, electrons actually exist in probability clouds (orbitals). For exam purposes, the shell model is fine, but know that it's a simplification. A sneaky trap: students write the electron configuration of potassium (atomic number 19) as 2, 8, 9. Wrong — the third shell holds a maximum of 8 electrons at this level, so it's 2, 8, 8, 1. That last electron starts a new fourth shell. This is a common JAMB trick question.`,
    questions: [
      'An element X has atomic number 17 and mass number 35. State the number of protons, neutrons, and electrons in a neutral atom of X. Write its electron configuration.',
      'Explain what isotopes are and give one reason why different isotopes of the same element have identical chemical properties.',
      'Using electron configuration, explain why sodium (Na) is more reactive than magnesium (Mg), even though magnesium has more electrons.'
    ]
  },

  'types-of-chemical-bonding-explained': {
    title: "Chemical Bonding — Why Atoms Can't Just Be Single Forever",
    breakdown: `Atoms bond because they want stability — specifically, they want a full outer electron shell (like the noble gases, which have 8 electrons in their outer shell, or 2 for helium). There are three main types of chemical bonds: ionic, covalent, and metallic.

Ionic bonding happens between metals and non-metals. The metal atom loses its outer electron(s) to become a positive ion (cation), and the non-metal gains those electron(s) to become a negative ion (anion). The opposite charges attract, forming a strong electrostatic bond. Example: sodium (2,8,1) loses 1 electron to become Na⁺, chlorine (2,8,7) gains it to become Cl⁻, forming NaCl. Ionic compounds have high melting points, conduct electricity when dissolved or molten, and form crystal lattice structures. Covalent bonding happens between non-metals. Instead of transferring electrons, atoms share pairs of electrons. Each shared pair is one covalent bond. Water (H₂O) has two covalent bonds — each hydrogen shares one electron with oxygen. Covalent compounds generally have lower melting points and don't conduct electricity. Metallic bonding occurs in metals — metal atoms release their outer electrons into a shared "sea of electrons" that moves freely between positive metal ions. This sea of electrons explains why metals conduct electricity and heat, are malleable, and are ductile.`,
    examRelevance: `Bonding is absolutely essential for WAEC and JAMB. You'll be asked to identify bond types from formulas, explain properties of compounds based on their bonding, or draw dot-and-cross diagrams. JAMB loves: "Which type of bonding is present in MgO?" (Answer: ionic). "Which type of bonding is present in CH₄?" (Answer: covalent). WAEC regularly asks you to draw electron dot-and-cross diagrams for compounds like NaCl, MgO, H₂O, CO₂, and NH₃. NECO tests the relationship between bonding and physical properties — why does NaCl have a high melting point? Why doesn't CCl₄ conduct electricity? The comparison table between ionic and covalent compounds is a classic essay question worth 8-10 marks.`,
    commonTrap: `A common error: saying ionic bonds involve "sharing" of electrons. No — ionic bonds involve TRANSFER (one atom gives, the other takes). Covalent bonds involve sharing. Get these mixed up and you lose marks on the most basic bonding question. Another trap: students say "NaCl is a molecule." Ionic compounds don't form molecules — they form lattice structures of alternating ions. Use "formula unit" instead of "molecule" for ionic compounds. Also, don't assume all covalent compounds are gases or liquids. Diamond and silicon dioxide are covalent but have extremely high melting points because they form giant covalent structures (macromolecular). WAEC has used diamond as a trick question in bond-type identification before.`,
    questions: [
      'Draw dot-and-cross diagrams for the formation of (i) sodium chloride (NaCl) and (ii) water (H₂O). Label the type of bonding in each.',
      'Explain why sodium chloride has a high melting point but hydrogen chloride does not, even though both contain chlorine.',
      'Metals are good conductors of electricity while covalent compounds generally are not. Explain this difference in terms of their bonding and structure.'
    ]
  },

  'electrolysis-of-brine-and-water': {
    title: 'Electrolysis — Using Electricity to Break Stuff Apart (On Purpose)',
    breakdown: `Electrolysis is using electricity to decompose a compound. You need an electrolyte (a liquid that conducts electricity — either a molten ionic compound or an ionic compound dissolved in water), two electrodes (conductors dipped into the electrolyte — the anode is positive, the cathode is negative), and a power source (battery or DC supply).

Here's what happens: when you pass electricity through the electrolyte, positive ions (cations) move to the cathode (negative electrode) where they gain electrons (reduction). Negative ions (anions) move to the anode (positive electrode) where they lose electrons (oxidation). Remember: OILRIG — Oxidation Is Loss, Reduction Is Gain. Or "AN OX and RED CAT" — ANode = OXidation, REDuction at the CAThode. For the electrolysis of brine (concentrated sodium chloride solution), chlorine gas is produced at the anode, hydrogen gas at the cathode, and sodium hydroxide solution is left behind. For acidified water, you get oxygen at the anode and hydrogen at the cathode — in a 1:2 volume ratio (because water is H₂O). Faraday's laws tell you how much substance is deposited or released: the amount is directly proportional to the quantity of electricity passed (current × time).`,
    examRelevance: `WAEC practical exams frequently involve electrolysis setups. You'll need to identify gases produced at each electrode (test: hydrogen — squeaky pop with a burning splint; chlorine — bleaches damp litmus paper; oxygen — relights a glowing splint). JAMB tests the products of electrolysis for different electrolytes — know brine, dilute H₂SO₄, CuSO₄ solution (with copper electrodes vs carbon electrodes — results differ!). WAEC theory often asks about Faraday's first and second laws of electrolysis, or calculations involving the mass of substance deposited given current and time. NECO likes asking about industrial applications — chlor-alkali process (electrolysis of brine produces chlorine, hydrogen, and NaOH, all commercially valuable).`,
    commonTrap: `The number one mistake: mixing up which electrode is which. The anode is POSITIVE and the cathode is NEGATIVE. Cations go to the cathode. Anions go to the anode. Students who get this backwards get everything else wrong. A memory trick: CATions go to the CAThode. Another trap: thinking that electrolysis works with any liquid. It only works with electrolytes — substances that contain free-moving ions. Pure water barely conducts; you need to add acid or a soluble salt. Solid ionic compounds don't work either — they need to be molten or dissolved so the ions can move. Also, the products at the electrodes can change depending on the concentration of the solution and the type of electrode used. WAEC specifically tests this with copper sulfate solution.`,
    questions: [
      'State the products formed at the anode and cathode during the electrolysis of (i) concentrated sodium chloride solution and (ii) dilute sulphuric acid.',
      'Explain using Faraday\'s first law why passing electricity for a longer time produces more substance at the electrode.',
      'A student electrolyzes copper(II) sulphate solution using carbon electrodes, then repeats using copper electrodes. Explain how and why the results differ.'
    ]
  },

  'acids-bases-and-salts-in-chemistry': {
    title: "Acids and Bases — The pH Scale Is Actually Pretty Simple",
    breakdown: `Acids are substances that produce hydrogen ions (H⁺) when dissolved in water. Bases are substances that produce hydroxide ions (OH⁻). An alkali is simply a base that dissolves in water. The pH scale runs from 0 to 14 — below 7 is acidic, exactly 7 is neutral, above 7 is alkaline/basic. The lower the pH, the stronger the acid. The higher the pH, the stronger the base.

When an acid reacts with a base, you get a salt and water. That's neutralization: Acid + Base → Salt + Water. For example, HCl + NaOH → NaCl + H₂O. The salt formed depends on which acid and which base you use. Hydrochloric acid (HCl) forms chloride salts. Sulphuric acid (H₂SO₄) forms sulphate salts. Nitric acid (HNO₃) forms nitrate salts. Indicators like litmus, methyl orange, and phenolphthalein change color to tell you if something is acidic or basic. In titration experiments, you carefully add an acid to a base (or vice versa) with an indicator to find the exact point of neutralization — the end point. Titration is a massive part of WAEC chemistry practicals, so know the procedure inside out: rinse the burette with acid, rinse the pipette with base, use the right indicator, record your readings to two decimal places.`,
    examRelevance: `Acids and bases show up in WAEC every single year — in theory, practical, or both. WAEC practical chemistry almost always includes a titration experiment. You need to know: how to set up a titration, how to read a burette, how to calculate concentration or volume from titration results, and when to use which indicator (methyl orange for strong acid + weak base, phenolphthalein for weak acid + strong base). JAMB tests the definitions, reactions, and properties: "What is the salt formed when sulphuric acid reacts with sodium hydroxide?" (Answer: sodium sulphate, Na₂SO₄). NECO asks about the preparation of different types of salts — soluble salts by titration, insoluble salts by precipitation. Know the general equations for acid reactions: acid + metal, acid + base, acid + carbonate.`,
    commonTrap: `Students often say "all acids are dangerous." Weak acids like citric acid (in oranges) and ethanoic acid (in vinegar) are perfectly safe to consume. Strong vs weak refers to how completely the acid dissociates in water — HCl fully dissociates (strong), CH₃COOH partially dissociates (weak). Don't confuse strong/weak with concentrated/dilute — those refer to how much acid is dissolved in a given volume of water. A dilute solution of a strong acid is still a strong acid. In titration calculations, students often forget to account for the mole ratio. H₂SO₄ has 2 H⁺ ions per molecule, so the mole ratio with NaOH is 1:2, not 1:1. Getting this wrong doubles (or halves) your answer. Always write the balanced equation first.`,
    questions: [
      'Explain the difference between a strong acid and a concentrated acid. Give one example of each.',
      'Describe how you would prepare a pure dry sample of sodium chloride from hydrochloric acid and sodium hydroxide solution using titration.',
      'A student adds excess hydrochloric acid to marble chips (calcium carbonate). Write the balanced equation and describe what you would observe during the reaction.'
    ]
  },

  'organic-chemistry-naming-and-nomenclature': {
    title: "Organic Chemistry Naming — It's Just a Pattern, Not a Punishment",
    breakdown: `Organic chemistry is the chemistry of carbon compounds. Carbon can form four bonds, which means it can create long chains, branches, and rings — that's why there are millions of organic compounds. But naming them follows a logical system called IUPAC nomenclature, and once you see the pattern, it clicks.

The name of an organic compound tells you three things: the length of the carbon chain (prefix), the type of bond (infix), and the functional group (suffix). The prefixes go: meth- (1 carbon), eth- (2), prop- (3), but- (4), pent- (5), hex- (6). The infixes: -an- means all single bonds (saturated), -en- means there's a double bond, -yn- means there's a triple bond. The suffixes: -e for hydrocarbons (alkanes, alkenes, alkynes), -ol for alcohols, -al for aldehydes, -one for ketones, -oic acid for carboxylic acids. So "propanol" = 3 carbons + single bonds + alcohol group. "Ethene" = 2 carbons + double bond + hydrocarbon. The homologous series is a family of compounds with the same functional group and a general formula where each member differs by CH₂. Alkanes: CₙH₂ₙ₊₂. Alkenes: CₙH₂ₙ. Alkanols: CₙH₂ₙ₊₁OH. Learn these general formulas — WAEC uses them in objective questions constantly.`,
    examRelevance: `WAEC tests organic naming in both objective and theory sections. A typical question: "Name the compound with the structural formula CH₃CH₂OH" (Answer: ethanol). Or: "Write the structural formula of butanoic acid." JAMB often gives you a molecular formula and asks you to name the compound or identify its homologous series. NECO likes testing isomerism — compounds with the same molecular formula but different structural arrangements. Know the first five members of each homologous series (alkanes, alkenes, alkynes, alkanols, alkanoic acids), their structural formulas, physical properties (boiling point increases with chain length), and chemical reactions (substitution for alkanes, addition for alkenes). The concept of functional groups — the part of the molecule responsible for its characteristic reactions — is central to every organic chemistry question.`,
    commonTrap: `The biggest mistake is counting carbons wrong. Always count the LONGEST continuous carbon chain, not just any chain. If there's a branch, the longest chain might not be the one drawn in a straight line. Students also confuse structural isomers with homologues. Isomers have the same molecular formula but different structures (propan-1-ol vs propan-2-ol). Homologues are consecutive members of the same series differing by CH₂ (ethanol, propanol, butanol). Another trap: students write "methene" or "methyne." These don't exist — you need at least 2 carbons for a double bond (ethene) or triple bond (ethyne). WAEC has used this as a trick option in multiple-choice questions.`,
    questions: [
      'Draw the structural formulas and name all possible isomers of C₄H₁₀. State what type of isomerism this is.',
      'Explain what is meant by a "homologous series." Give the first three members of the alkanol series with their structural formulas.',
      'An unknown organic compound has the molecular formula C₂H₆O. It reacts with sodium metal to produce hydrogen gas. Identify the compound and name the functional group responsible for this reaction.'
    ]
  },

  'how-to-calculate-mole-concept-in-chemistry': {
    title: "The Mole Concept — Counting Atoms Without Losing Your Mind",
    breakdown: `Atoms are incredibly tiny. You can't count them one by one. So chemists invented the mole — a counting unit, like a "dozen" but much bigger. One mole of anything contains 6.02 × 10²³ particles (Avogadro's number). Whether it's atoms, molecules, ions, or electrons — one mole is always 6.02 × 10²³ of them.

The molar mass of an element is its relative atomic mass expressed in grams per mole. Carbon has a relative atomic mass of 12, so one mole of carbon weighs 12g. For compounds, add up all the atomic masses: H₂O = (2 × 1) + 16 = 18 g/mol. The key formula is: number of moles = mass ÷ molar mass (n = m/M). For gases at standard temperature and pressure (STP), one mole occupies 22.4 dm³ (or 22,400 cm³). So: moles of gas = volume ÷ molar volume. For solutions, concentration (in mol/dm³) = number of moles ÷ volume in dm³. These three relationships — moles from mass, moles from gas volume, moles from solution concentration — are the foundation of all stoichiometric calculations. Stoichiometry is just using the mole ratio from a balanced equation to find how much of one substance reacts with or produces another.`,
    examRelevance: `The mole concept is arguably the most-tested topic in WAEC chemistry. Calculations appear in both the objective and theory sections every single year. JAMB loves questions like: "How many moles are in 44g of CO₂?" (Molar mass of CO₂ = 12 + 32 = 44 g/mol, so 44/44 = 1 mole). WAEC theory questions often involve multi-step stoichiometry: given the mass of a reactant, find the volume of gas produced, or the mass of another product. NECO tests the relationship between moles and Avogadro's number: "How many molecules are in 2 moles of water?" (Answer: 2 × 6.02 × 10²³ = 1.204 × 10²⁴ molecules). Practice calculations religiously. This is one topic where knowing the theory isn't enough — you need speed and accuracy with numbers.`,
    commonTrap: `The most common mistake: using the wrong molar mass. Students forget to multiply the atomic mass by the number of atoms in the formula. For H₂SO₄, it's (2 × 1) + 32 + (4 × 16) = 98 g/mol, not 49 or some other incorrect number. Another trap: confusing dm³ with cm³ in gas and solution calculations. 1 dm³ = 1000 cm³. If you mix up the units, your answer will be off by a factor of 1000. Also, at STP the molar volume of a gas is 22.4 dm³, but some questions use room temperature and pressure (RTP) where it's 24 dm³. Read the question carefully to see which conditions are specified. Finally, students often skip balancing the equation before doing stoichiometry — you MUST have a balanced equation for the mole ratios to be correct.`,
    questions: [
      'Calculate the number of moles of oxygen gas (O₂) produced when 10g of potassium trioxochlorate(V) (KClO₃) is completely decomposed. [K=39, Cl=35.5, O=16]',
      'What volume of carbon dioxide gas at STP would be produced from the complete combustion of 6g of carbon? [C=12, Molar volume at STP = 22.4 dm³]',
      'Explain why the statement "1 mole of hydrogen" is ambiguous. What is the difference between 1 mole of hydrogen atoms and 1 mole of hydrogen molecules?'
    ]
  },

  'gas-laws-in-chemistry-with-examples': {
    title: "Gas Laws — Boyle, Charles, and the Ideal Gas (They're All Connected)",
    breakdown: `Gases behave predictably when you change their temperature, pressure, or volume. The gas laws describe these relationships mathematically.

Boyle's Law: At constant temperature, the volume of a fixed mass of gas is inversely proportional to its pressure. P₁V₁ = P₂V₂. Squeeze a gas (increase pressure), its volume decreases. Think of pressing a syringe with your thumb over the end. Charles's Law: At constant pressure, the volume of a fixed mass of gas is directly proportional to its absolute temperature (in Kelvin). V₁/T₁ = V₂/T₂. Heat a gas, it expands. That's why hot air balloons float — the heated air inside is less dense. General Gas Law: Combines both — P₁V₁/T₁ = P₂V₂/T₂. Use this when pressure, volume, AND temperature all change. Ideal Gas Equation: PV = nRT, where n is the number of moles and R is the gas constant (8.314 J/mol·K or 0.0821 atm·L/mol·K). This connects the gas laws to the mole concept. The key thing to remember: ALWAYS convert temperature to Kelvin (K = °C + 273). Using Celsius in gas law calculations will give you wrong answers every time.`,
    examRelevance: `Gas laws appear in WAEC and JAMB consistently. Calculation questions are common: "A gas occupies 500cm³ at 27°C and 1 atm. What volume will it occupy at 127°C and 2 atm?" (Use the general gas law — don't forget to convert to Kelvin first). JAMB loves straightforward Boyle's and Charles's law calculations. WAEC sometimes asks you to state the law before doing the calculation, or to sketch graphs (Boyle's law gives a curve of P vs V, a straight line for P vs 1/V; Charles's law gives a straight line of V vs T). NECO tests your understanding of the assumptions of the ideal gas model: gas molecules have negligible volume, no intermolecular forces, perfectly elastic collisions. Know when real gases deviate from ideal behavior (at high pressure and low temperature).`,
    commonTrap: `The NUMBER ONE mistake with gas laws: forgetting to convert temperature to Kelvin. If the question says 27°C, you must use 300K (27 + 273). Using 27 in the formula gives a completely wrong answer. This single mistake has cost more WAEC marks than probably any other error in chemistry. Another trap: confusing STP (0°C = 273K, 1 atm) with room conditions (25°C = 298K, 1 atm). Also, students sometimes use the wrong gas law — Boyle's when temperature changes, or Charles's when pressure changes. Read the question carefully: if temperature is constant, use Boyle's. If pressure is constant, use Charles's. If both change, use the general gas law.`,
    questions: [
      'A gas has a volume of 200 cm³ at 25°C and 760 mmHg. Calculate its volume at 100°C and 800 mmHg.',
      'Sketch and explain the graph of volume against absolute temperature for an ideal gas at constant pressure. What does the x-intercept represent?',
      'State two conditions under which a real gas deviates significantly from ideal gas behavior. Explain why this happens at the molecular level.'
    ]
  },

  'what-are-redox-reactions': {
    title: "Redox Reactions — Electrons Are Just Moving Houses",
    breakdown: `A redox reaction is any reaction where electrons are transferred from one substance to another. It's actually two processes happening simultaneously: oxidation (losing electrons) and reduction (gaining electrons). They always happen together — you can't have one without the other, because the electrons that one substance loses must go somewhere.

The easiest way to remember: OIL RIG — Oxidation Is Loss (of electrons), Reduction Is Gain (of electrons). When iron rusts, iron atoms lose electrons (oxidized) and oxygen gains those electrons (reduced). In the reaction Zn + CuSO₄ → ZnSO₄ + Cu, zinc is oxidized (goes from Zn⁰ to Zn²⁺, losing 2 electrons) and copper is reduced (goes from Cu²⁺ to Cu⁰, gaining 2 electrons). Oxidation numbers (oxidation states) help you track electron transfer. An element in its pure form has an oxidation number of 0. In compounds, oxygen is usually -2, hydrogen is usually +1. An increase in oxidation number means oxidation; a decrease means reduction. The substance that causes oxidation (by accepting electrons) is the oxidizing agent. The substance that causes reduction (by donating electrons) is the reducing agent. The reducing agent itself gets oxidized, and the oxidizing agent itself gets reduced. Yes, it sounds backwards, but it makes sense — the thing that gives away electrons (reducing agent) gets oxidized in the process.`,
    examRelevance: `Redox reactions are tested heavily in both WAEC and JAMB. You'll be asked to identify what's oxidized and what's reduced, assign oxidation numbers, identify oxidizing and reducing agents, and balance redox equations. JAMB loves: "In the reaction 2Fe + 3Cl₂ → 2FeCl₃, the oxidizing agent is ___" (Answer: Cl₂, because it gains electrons/causes Fe to be oxidized). WAEC essay questions often ask you to use oxidation numbers to determine which element is oxidized and which is reduced. NECO tests balancing redox equations using the half-reaction method — split the reaction into oxidation and reduction half-equations, balance electrons, then combine. Know common oxidizing agents (KMnO₄, K₂Cr₂O₇, concentrated H₂SO₄, halogens) and reducing agents (metals, H₂S, carbon, carbon monoxide).`,
    commonTrap: `The most common mistake: confusing the oxidizing agent with the substance that is oxidized. The oxidizing agent is the one that GETS REDUCED (gains electrons). It causes the other substance to be oxidized. Think of it this way: the oxidizing agent is the electron thief — it takes electrons from others (oxidizing them) and gains electrons itself (being reduced). Another trap: incorrect oxidation number assignments. Remember the rules: free elements = 0, monatomic ions = their charge, O = -2 (except in peroxides where it's -1), H = +1 (except in metal hydrides where it's -1), and the sum of oxidation numbers in a compound = 0 (or equals the ion charge for polyatomic ions). Students also forget that displacement reactions (like Zn + CuSO₄) are redox reactions — if a more reactive metal displaces a less reactive one, electrons are being transferred.`,
    questions: [
      'In the reaction: MnO₂ + 4HCl → MnCl₂ + Cl₂ + 2H₂O, identify the element that is oxidized and the element that is reduced. State the oxidizing agent and the reducing agent.',
      'Assign oxidation numbers to all atoms in K₂Cr₂O₇. If Cr goes from +6 to +3 in a reaction, has it been oxidized or reduced? Explain your reasoning.',
      'Write the ionic half-equations for the reaction between zinc and copper(II) sulphate solution. Label the oxidation half-equation and the reduction half-equation.'
    ]
  },

  'periodic-table-trends-explained': {
    title: "Periodic Table Trends — The Cheat Codes Hidden in the Table",
    breakdown: `The periodic table isn't random. Elements are arranged by increasing atomic number, and the magic is that elements in the same group (vertical column) have similar chemical properties because they have the same number of electrons in their outermost shell. The rows are called periods. The columns are called groups.

Here are the key trends you need to know. Atomic radius DECREASES across a period (left to right) because more protons pull the electrons closer despite them being in the same shell. It INCREASES down a group because new electron shells are added, making the atom bigger. Ionization energy (the energy needed to remove an outer electron) INCREASES across a period (electrons are held more tightly) and DECREASES down a group (outer electrons are farther from the nucleus and easier to remove). Electronegativity (how strongly an atom attracts bonding electrons) INCREASES across a period and DECREASES down a group. Fluorine is the most electronegative element. Metallic character DECREASES across a period (left side = metals, right side = non-metals) and INCREASES down a group. Reactivity depends on the group: for Group I metals, reactivity INCREASES down the group (easier to lose that outer electron). For Group VII (halogens), reactivity DECREASES down the group (harder to attract an extra electron when the atom is bigger).`,
    examRelevance: `Periodic table trends are a WAEC and JAMB staple. You'll be asked to compare properties of elements across a period or down a group. JAMB loves: "Which of the following elements has the highest ionization energy?" (Usually the one furthest right and highest up in the period — excluding noble gases for most contexts). WAEC essay questions ask you to "explain the trend in atomic radius across Period 3" or "account for the increase in reactivity of Group I metals down the group." NECO tests your ability to predict properties of elements based on their position. If you know where an element sits in the periodic table, you should be able to predict its approximate atomic size, reactivity, metallic/non-metallic character, and type of bonding. That's the power of understanding trends.`,
    commonTrap: `Students often say atomic radius increases across a period because "more electrons means bigger atom." Wrong. More electrons across the same period means more protons too, and the stronger nuclear charge pulls all electrons closer, making the atom SMALLER. The atom only gets bigger when you add a new shell (going down a group). Another mistake: saying Group I metals are less reactive going down the group. It's the opposite — they get MORE reactive because the outer electron is farther from the nucleus and easier to lose. For halogens (Group VII), it's the reverse — they get LESS reactive going down because the atom is larger and less able to attract an extra electron. Also, noble gases (Group VIII/0) are not "unreactive" because they're special — they're unreactive because their outer shell is already full. WAEC has specifically tested why noble gases don't easily form bonds.`,
    questions: [
      'Explain why chlorine has a smaller atomic radius than sodium, even though they are in the same period.',
      'Arrange the following elements in order of increasing ionization energy: Na, Mg, Al, Si. Justify your arrangement.',
      'Explain why fluorine is more reactive than iodine, but lithium is less reactive than caesium. How do you reconcile these seemingly opposite trends?'
    ]
  },

  'factors-affecting-rate-of-reaction': {
    title: 'Rate of Reaction — Why Some Reactions Are Fast and Others Take Forever',
    breakdown: `Some reactions are almost instant — like an explosion. Others take years — like iron rusting. The rate of reaction measures how quickly reactants are converted into products. It can be measured by how fast a reactant is used up or how fast a product is formed, per unit time.

Collision theory explains it: for a reaction to occur, reactant particles must (1) collide with each other, (2) with sufficient energy (at least the activation energy), and (3) with the correct orientation. Anything that increases the frequency or energy of collisions speeds up the reaction. Five key factors: Temperature — higher temperature means particles have more kinetic energy, move faster, collide more frequently AND more energetically. A 10°C rise roughly doubles the rate. Concentration — more particles in the same volume means more frequent collisions. Surface area — grinding a solid into powder exposes more surface for collisions (that's why powdered reactants react faster than lumps). Catalyst — lowers the activation energy, providing an alternative reaction pathway. The catalyst isn't used up. Pressure (for gases) — increasing pressure is like increasing concentration for gases; it forces particles closer together. You can measure reaction rate by collecting gas volume over time, measuring mass loss over time, or timing color changes.`,
    examRelevance: `WAEC loves rate of reaction — it appears in both theory and practical exams. A common practical: reacting marble chips with hydrochloric acid and measuring the volume of CO₂ produced over time. You'll need to draw and interpret rate curves (volume of gas vs time). JAMB asks: "Which of the following would increase the rate of reaction between zinc and hydrochloric acid?" (Answer: using powdered zinc instead of granules / increasing the concentration of HCl / raising the temperature). WAEC essay questions often ask you to explain HOW and WHY each factor affects the rate, using collision theory. NECO tests your ability to sketch and compare rate curves — for example, "Draw two curves on the same axes: one for the reaction at 25°C and one at 40°C. Explain the difference."`,
    commonTrap: `The biggest mistake: saying a catalyst "speeds up the reaction" without explaining HOW. The correct explanation is that a catalyst provides an alternative pathway with a lower activation energy. More particles now have enough energy to react, so the rate increases. The catalyst is NOT used up and does NOT change the products or the total amount of product — it just gets there faster. Another trap: students say "increasing temperature gives particles more energy to collide." Be more specific — it increases kinetic energy, which means particles move faster (more frequent collisions) AND a greater proportion of collisions have energy ≥ activation energy (more successful collisions). Both effects matter. Also, surface area only matters for reactions involving solids. If both reactants are liquids or gases, surface area isn't a relevant factor.`,
    questions: [
      'Using collision theory, explain why a reaction between powdered calcium carbonate and hydrochloric acid is faster than the same reaction using marble chips of the same mass.',
      'A student measures the volume of gas produced in a reaction at 30°C and then repeats it at 50°C. Sketch the expected curves on the same axes and explain the differences.',
      'Explain why a catalyst increases the rate of reaction without being consumed. Include the concept of activation energy in your answer.'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PHYSICS (10)
  // ═══════════════════════════════════════════════════════════════════════════

  'newtons-three-laws-of-motion-explained': {
    title: "Newton's Laws — The Three Rules That Explain Why Anything Moves",
    breakdown: `Isaac Newton figured out three laws that describe how everything moves. Everything. From your textbook sliding off the desk to a rocket launching into space.

First Law (Inertia): An object stays at rest or keeps moving at constant velocity unless acted on by an external force. Your book stays on the table until you push it. A ball rolling on a perfectly smooth surface would roll forever if nothing stopped it. Inertia is the tendency of an object to resist changes in its motion, and it depends on mass — heavier objects have more inertia. Second Law (F = ma): The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. Force = mass × acceleration. Push a shopping trolley — it accelerates. Push it harder (more force) — it accelerates more. Load it with groceries (more mass) — same push gives less acceleration. The unit of force is the Newton (N), where 1 N = 1 kg × 1 m/s². Third Law (Action-Reaction): For every action, there is an equal and opposite reaction. You push on a wall, the wall pushes back on you with the same force. A rocket pushes exhaust gases downward, the gases push the rocket upward. Importantly, the action and reaction forces act on DIFFERENT objects — that's why they don't cancel out.`,
    examRelevance: `Newton's laws are JAMB and WAEC constants. JAMB asks definition-style questions: "State Newton's first law of motion" or "Newton's second law relates force, mass, and ___" (Answer: acceleration). Calculation questions using F = ma are extremely common: "A force of 20N acts on a body of mass 4kg. Calculate the acceleration" (Answer: a = F/m = 20/4 = 5 m/s²). WAEC essay questions ask you to state all three laws and give practical examples of each. NECO likes to test your understanding of inertia — "Explain why passengers in a bus jerk forward when the bus stops suddenly." Also know the concept of equilibrium (when the net force is zero, acceleration is zero — the object is either stationary or moving at constant velocity). Newton's laws connect to momentum, friction, and circular motion, so mastering them unlocks several other topics.`,
    commonTrap: `The most common mistake with the third law: students think action and reaction forces cancel out. They don't — because they act on DIFFERENT objects. You push the table (force on table), the table pushes you back (force on you). These are two different forces on two different objects. They'd only cancel if they were on the same object. Another trap: saying "an object at rest has no forces acting on it." Wrong — it has forces, but they're balanced (net force = zero). Your book on the table has gravity pulling it down and the table pushing it up — equal and opposite, so net force is zero and the book stays put. Also, F = ma gives ACCELERATION, not velocity. A common WAEC trick question gives you force and mass and asks for velocity — you can't find velocity from F = ma alone without knowing time or initial velocity.`,
    questions: [
      'A car of mass 1200 kg accelerates from rest to 20 m/s in 10 seconds. Calculate the net force acting on the car.',
      'Explain, using Newton\'s first law, why wearing a seatbelt is important during a car crash.',
      'A boy standing on a skateboard pushes against a wall. The skateboard moves backward. Explain this using Newton\'s third law.'
    ]
  },

  'electromagnetic-induction-and-faradays-law': {
    title: "Electromagnetic Induction — How Moving a Magnet Creates Electricity",
    breakdown: `Electromagnetic induction is the process of generating an electromotive force (EMF or voltage) by changing the magnetic field around a conductor. Michael Faraday discovered it in 1831, and it's the principle behind every generator, transformer, and power plant in the world.

Here's the core idea: when a magnetic field through a coil of wire changes — either because you move the magnet, move the coil, or change the field strength — an EMF is induced in the coil. If the coil is part of a complete circuit, this EMF drives a current. Faraday's Law says the magnitude of the induced EMF is proportional to the rate of change of magnetic flux linkage. In simple terms: move the magnet faster = bigger voltage. More turns in the coil = bigger voltage. Stronger magnet = bigger voltage. Lenz's Law tells you the direction: the induced current always flows in a direction that opposes the change causing it. Push a north pole into a coil, the coil creates its own north pole facing the magnet (to repel it). This isn't the coil being difficult — it's conservation of energy. If the current helped the magnet move in, you'd get free energy, which violates physics. A generator works by rotating a coil in a magnetic field — the changing magnetic flux through the coil induces an alternating EMF. A transformer uses electromagnetic induction to step voltage up or down — an alternating current in the primary coil creates a changing magnetic field that induces a voltage in the secondary coil.`,
    examRelevance: `WAEC and JAMB test electromagnetic induction regularly. Common questions: "State Faraday's law of electromagnetic induction" (the induced EMF is proportional to the rate of change of magnetic flux), "State Lenz's law" (the induced current opposes the change producing it). JAMB loves: "Which of the following would NOT increase the induced EMF in a coil?" (trick option: using a thicker wire — thickness doesn't matter, it's the number of turns, speed, and magnet strength). WAEC essay questions ask about the structure and working principle of AC generators and transformers. For transformers, know the formula: Vp/Vs = Np/Ns (primary voltage over secondary voltage equals primary turns over secondary turns). NECO tests the applications: generators in power plants, transformers in electricity distribution, induction cookers.`,
    commonTrap: `Students often say "a magnet near a coil produces electricity." Not quite — the magnet must be MOVING relative to the coil (or the magnetic field must be CHANGING). A stationary magnet near a stationary coil produces zero EMF. It's the CHANGE in magnetic flux that matters. Another trap: confusing electromagnetic induction with electrostatics. They're completely different phenomena. Also, for transformers, students forget that transformers only work with alternating current (AC), not direct current (DC). DC creates a constant magnetic field, so there's no changing flux and no induced EMF in the secondary coil. In calculations, students sometimes get the turns ratio upside down — remember Vp/Vs = Np/Ns (not the other way around). A step-up transformer has more turns in the secondary coil and produces a higher voltage.`,
    questions: [
      'A bar magnet is pushed into a coil of 200 turns connected to a galvanometer. State three ways you could increase the deflection of the galvanometer.',
      'Explain, using Lenz\'s law, why energy must be supplied to push a magnet into a coil. What would happen if Lenz\'s law didn\'t hold?',
      'A transformer has 500 turns in the primary coil and 2000 turns in the secondary coil. If the input voltage is 240V, calculate the output voltage. Is this a step-up or step-down transformer?'
    ]
  },

  'properties-of-waves-in-physics': {
    title: "Wave Properties — Frequency, Wavelength, and Why Sound Can't Travel in Space",
    breakdown: `A wave is a disturbance that transfers energy from one place to another without transferring matter. Throw a stone in a pond — the ripples move outward, but the water itself just bobs up and down. The energy travels; the water doesn't.

There are two main types: transverse waves and longitudinal waves. In transverse waves, the vibration is perpendicular (at right angles) to the direction of wave travel. Think of light waves, water waves, and electromagnetic waves. If the wave moves horizontally, the vibration is vertical. In longitudinal waves, the vibration is parallel to the direction of travel. Sound waves are longitudinal — the air particles vibrate back and forth in the same direction the sound is travelling, creating compressions (particles close together) and rarefactions (particles spread apart). Key wave properties: amplitude (maximum displacement from rest — related to loudness for sound or brightness for light), wavelength (λ — distance between two consecutive corresponding points, like crest to crest), frequency (f — number of complete waves per second, measured in Hertz), and period (T — time for one complete wave, T = 1/f). The wave equation connects them: velocity = frequency × wavelength, or v = fλ. This equation works for ALL waves.`,
    examRelevance: `Waves are a core WAEC and JAMB topic. Calculations using v = fλ are almost guaranteed. JAMB example: "A wave has a frequency of 50 Hz and a wavelength of 4m. Calculate its velocity" (Answer: v = 50 × 4 = 200 m/s). WAEC asks about the properties and differences between transverse and longitudinal waves — typically a comparison table. NECO tests reflection, refraction, diffraction, and interference of waves. Know that sound waves need a medium to travel (they can't travel through a vacuum — that's why there's no sound in space), while light waves (electromagnetic waves) can travel through a vacuum. WAEC practical questions sometimes involve measuring the speed of sound or the frequency of a vibrating string. Also know the electromagnetic spectrum: radio waves → microwaves → infrared → visible light → ultraviolet → X-rays → gamma rays, in order of increasing frequency and decreasing wavelength.`,
    commonTrap: `The biggest mistake: saying "waves carry matter from one place to another." Waves carry ENERGY, not matter. The particles of the medium vibrate about their positions but don't travel with the wave. Another trap: confusing wavelength with amplitude. Wavelength is the horizontal distance between two matching points (crest to crest). Amplitude is the vertical distance from the rest position to a crest (or trough). Students also sometimes say "frequency is the number of waves." Be precise: it's the number of complete waves passing a point per SECOND. Units matter — frequency is in Hertz (Hz), not just "waves." Also, the speed of a wave depends on the medium, not on its frequency or amplitude. A louder sound (higher amplitude) doesn't travel faster — it just has more energy.`,
    questions: [
      'A sound wave has a frequency of 340 Hz and travels at 340 m/s. Calculate its wavelength. If the frequency is doubled, what happens to the wavelength?',
      'Explain why sound cannot travel through a vacuum but light can. Relate your answer to the types of waves involved.',
      'Draw a labeled diagram of a transverse wave showing one complete wavelength, amplitude, crest, and trough.'
    ]
  },

  'nuclear-physics-and-radioactive-decay': {
    title: "Nuclear Physics — Splitting Atoms Without Blowing Anything Up",
    breakdown: `Nuclear physics deals with the nucleus of the atom — that tiny, dense core containing protons and neutrons. The nucleus is held together by the strong nuclear force, which is powerful enough to overcome the electrical repulsion between positively charged protons. But some nuclei are unstable, and they release energy and particles to become more stable. That's radioactive decay.

There are three main types of nuclear radiation. Alpha (α) particles: helium nuclei (2 protons + 2 neutrons), positively charged, heavy, stopped by paper or skin, most ionizing but least penetrating. Beta (β) particles: high-speed electrons emitted when a neutron converts into a proton, negatively charged, lighter, stopped by aluminum, moderate ionizing and penetrating. Gamma (γ) rays: electromagnetic radiation (no mass, no charge), most penetrating (reduced but not fully stopped by thick lead or concrete), least ionizing. Nuclear fission is splitting a heavy nucleus (like uranium-235) into two lighter nuclei, releasing enormous energy — this powers nuclear reactors and atomic bombs. Nuclear fusion is combining light nuclei (like hydrogen) into heavier ones — this is what powers the sun. Fusion releases even more energy than fission but requires extreme temperatures (millions of degrees), which is why we haven't mastered fusion power plants yet.`,
    examRelevance: `JAMB and WAEC test nuclear physics with a focus on the three types of radiation, their properties, and how to distinguish them. A typical JAMB question: "Which type of radiation is deflected toward the negative plate in an electric field?" (Answer: alpha, because it's positively charged). WAEC asks comparison tables: charge, mass, penetrating power, ionizing power, and what stops each type. Half-life calculations are common in both exams: if a substance has a half-life of 10 days and you start with 80g, after 20 days (two half-lives), you'd have 20g left. NECO tests applications of radioactivity: carbon-14 dating, medical imaging (gamma rays), cancer treatment (cobalt-60), and industrial uses (thickness monitoring). Know the nuclear equations for alpha and beta decay — alpha emission reduces atomic number by 2 and mass number by 4; beta emission increases atomic number by 1 with no change in mass number.`,
    commonTrap: `Students mix up penetrating power and ionizing power. Alpha is the MOST ionizing but LEAST penetrating. Gamma is the LEAST ionizing but MOST penetrating. They're inversely related, and students frequently get them backwards. Another common mistake: saying half-life means "half the substance disappears." The atoms don't disappear — they decay into different atoms. After one half-life, half the radioactive atoms have decayed into a different element (the daughter nucleus). The total mass is conserved; it's the radioactive portion that halves. Also, students confuse fission and fusion. Fission = splitting heavy atoms (used in nuclear reactors). Fusion = combining light atoms (powers the sun). A memory trick: fission = "splitting" (both have 'ss'), fusion = "fusing together."`,
    questions: [
      'A radioactive isotope has a half-life of 6 hours. If you start with 400g of the isotope, how much will remain after 24 hours? Show your working.',
      'Complete the nuclear equation: ²³⁸₉₂U → ?₉₀Th + ⁴₂He. What type of decay is this? Explain how the atomic number and mass number changed.',
      'Explain why nuclear fusion releases more energy per unit mass than fission, yet we use fission (not fusion) in power plants. What is the main technical challenge of fusion?'
    ]
  },

  'projectile-motion-equations-and-examples': {
    title: "Projectile Motion — What Happens When You Throw Something at an Angle",
    breakdown: `Projectile motion is the motion of an object that's been launched into the air and is only affected by gravity (ignoring air resistance). A football kicked at an angle, a ball thrown upward, a bullet fired — these are all projectiles. The key insight is that projectile motion can be broken into two independent components: horizontal and vertical.

Horizontally, the projectile moves at constant velocity (no horizontal force, so no horizontal acceleration — Newton's first law). Vertically, the projectile accelerates downward at g = 9.8 m/s² (or 10 m/s² for easier calculation) due to gravity. These two motions happen simultaneously and independently. To solve projectile problems, you split the initial velocity into horizontal and vertical components: horizontal component = u cos θ, vertical component = u sin θ, where u is the initial speed and θ is the angle of projection. Then apply the equations of motion separately for each direction. Time of flight (total time in the air) = 2u sin θ / g. Maximum height = u² sin²θ / 2g. Range (horizontal distance) = u² sin 2θ / g. The maximum range occurs when θ = 45°. At 45°, sin 2θ = sin 90° = 1, which maximizes the range formula. That's why athletes instinctively aim for about 45° when throwing for distance.`,
    examRelevance: `Projectile motion is a WAEC and JAMB favorite, especially for calculation questions. Typical formats: "A ball is projected at 30° to the horizontal with a speed of 40 m/s. Calculate the time of flight, maximum height, and range." You MUST know the three formulas and how to use them. JAMB also tests conceptual understanding: "At the highest point of its trajectory, a projectile has ___" (Answer: zero vertical velocity, but its horizontal velocity is unchanged). WAEC essay questions sometimes ask you to derive the formulas or to explain why the path of a projectile is parabolic. NECO tests the special case of horizontal projection — where θ = 0° (like dropping a ball from a cliff or firing horizontally from a height). In this case, initial vertical velocity is zero, and you use h = ½gt² for the vertical motion.`,
    commonTrap: `The most common mistake: not splitting the initial velocity into components. Students plug the initial speed directly into equations meant for one direction only. If u = 40 m/s at 30°, the vertical component is 40 sin 30° = 20 m/s and the horizontal component is 40 cos 30° = 34.6 m/s. Using 40 m/s for vertical calculations gives wrong answers. Another trap: forgetting that at the maximum height, vertical velocity is zero (not total velocity — the projectile still moves horizontally). Also, students sometimes double the maximum height to get the range or confuse time to reach maximum height with total time of flight. Time of flight = 2 × time to reach maximum height. And don't forget: these formulas assume no air resistance. In real life, the actual range is less than calculated.`,
    questions: [
      'A stone is projected from the ground at an angle of 60° to the horizontal with a velocity of 20 m/s. Calculate (i) the time of flight, (ii) the maximum height reached, and (iii) the range. [g = 10 m/s²]',
      'Explain why a projectile launched at 45° achieves the maximum range. If the same projectile is launched at 30° and 60° with the same speed, compare their ranges.',
      'At the highest point of its trajectory, a ball has a speed of 15 m/s. If it was launched at 45°, what was its initial speed? [Hint: At the highest point, only the horizontal component of velocity remains.]'
    ]
  },

  'electric-circuits-series-and-parallel': {
    title: "Electric Circuits — Ohm's Law and Why Resistors Exist",
    breakdown: `An electric circuit is a closed path through which electric current flows. You need a source of EMF (battery), conductors (wires), and usually some components (resistors, bulbs, etc.). Current (I) is the rate of flow of charge, measured in amperes (A). Voltage (V) is the energy per unit charge, measured in volts (V). Resistance (R) is how much a component opposes the flow of current, measured in ohms (Ω).

Ohm's Law: V = IR. Voltage equals current times resistance. If you increase voltage (push harder), current increases. If you increase resistance (make it harder to flow), current decreases. Simple. In a series circuit, components are connected end to end in a single loop. The current is the SAME through all components, but the voltage is SHARED (split) across them. Total resistance = R₁ + R₂ + R₃. In a parallel circuit, components are connected in separate branches. The voltage is the SAME across all branches, but the current is SHARED (split) among them. Total resistance: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃. The total resistance in parallel is always LESS than the smallest individual resistance. Kirchhoff's laws formalize this: first law (junction rule) — total current into a junction equals total current out. Second law (loop rule) — the sum of EMFs in a loop equals the sum of potential drops.`,
    examRelevance: `Circuits are in every WAEC and JAMB physics paper. Calculation questions using V = IR are guaranteed. Typical: "A 6V battery is connected to a 3Ω resistor. What is the current?" (Answer: I = V/R = 6/3 = 2A). WAEC loves asking you to calculate total resistance for combinations of resistors in series and parallel — often in the same circuit (find equivalent resistance of the parallel section first, then add it to series resistors). JAMB tests conceptual understanding: "If one bulb in a series circuit blows, what happens to the other bulbs?" (Answer: they all go out, because the circuit is broken). NECO asks about Kirchhoff's laws and their applications. Know how to read circuit diagrams, identify series and parallel sections, and calculate current, voltage, and power (P = IV = I²R = V²/R) for each component.`,
    commonTrap: `The biggest mistake: mixing up rules for series and parallel. In series: same current, voltages add, resistances add. In parallel: same voltage, currents add, reciprocals of resistances add. Students constantly swap these. A memory trick: Series = Same current (both start with S). Another trap: when calculating parallel resistance, students add the resistances directly instead of using the reciprocal formula. For two resistors in parallel, the shortcut is R_total = (R₁ × R₂) / (R₁ + R₂). For more than two, use the reciprocal method. Also, students forget that the total resistance in parallel is always less than the smallest branch resistance — this is counterintuitive but important. And don't say "current is used up by resistors." Current is the same everywhere in a series circuit — it's ENERGY (voltage) that's used up.`,
    questions: [
      'Two resistors of 4Ω and 6Ω are connected in parallel, and this combination is connected in series with a 5Ω resistor. Calculate the total resistance of the circuit.',
      'A 12V battery is connected to three 6Ω resistors — two in parallel with each other, and that combination in series with the third. Calculate the current from the battery.',
      'Explain, using Kirchhoff\'s first law, why the current splits at a junction in a parallel circuit. Does the total current increase or decrease when a new branch is added?'
    ]
  },

  'how-lenses-and-mirrors-work-in-optics': {
    title: "Optics — How Lenses Bend Light (And Why Your Eyes Are Basically Cameras)",
    breakdown: `Light travels in straight lines through a uniform medium. But when it passes from one medium to another (like from air into glass), it changes speed and bends. That bending is called refraction, and it's the principle behind every lens.

A convex lens (converging lens) is thicker in the middle. It bends light inward, converging parallel rays to a single point called the focal point (F). The distance from the lens center to the focal point is the focal length (f). Convex lenses are used in magnifying glasses, cameras, and your eyes. A concave lens (diverging lens) is thinner in the middle. It spreads light outward so it appears to come from a virtual focal point behind the lens. Concave lenses are used to correct short-sightedness. For image formation, you use ray diagrams. Draw at least two of these three standard rays: (1) a ray parallel to the principal axis refracts through the focal point, (2) a ray through the center of the lens passes straight through undeviated, (3) a ray through the focal point refracts parallel to the axis. Where the rays meet (or appear to meet) is where the image forms. The lens formula: 1/f = 1/v - 1/u (or 1/f = 1/v + 1/u depending on sign convention), where u = object distance, v = image distance. Magnification = v/u = image height/object height. Real images form where rays actually converge (on a screen). Virtual images form where rays appear to diverge from (can't be projected on a screen).`,
    examRelevance: `WAEC regularly tests ray diagrams — you'll need to draw at least two rays, locate the image, and describe its properties (real/virtual, magnified/diminished, upright/inverted). JAMB asks calculation questions using the lens formula: "An object is placed 30cm from a convex lens of focal length 20cm. Calculate the image distance and magnification." NECO tests the differences between real and virtual images. Know the six image cases for a convex lens: object beyond 2F, at 2F, between F and 2F, at F, between F and the lens. For each, know where the image forms and its characteristics. Also know long-sightedness (corrected by convex lens) and short-sightedness (corrected by concave lens) — these are popular WAEC questions. The power of a lens = 1/f (in meters), measured in diopters (D). A lens with f = 0.5m has power = 2D.`,
    commonTrap: `Students often draw the refraction happening at the center of the lens instead of at both surfaces. For WAEC-level diagrams, a single refraction at the center line is acceptable, but know that light actually refracts at each glass-air interface. A bigger mistake: getting the sign convention wrong in calculations. In the "real is positive" convention, real object distances and real image distances are positive, virtual ones are negative. Mixing this up flips your answer. Another common error: saying concave lenses can form real images. A single concave lens ALWAYS produces virtual, upright, diminished images. Only convex lenses (or concave mirrors) can form real images. Also, students confuse properties of convex lenses with concave mirrors — a convex LENS converges light, but a convex MIRROR diverges light. Don't mix up lenses and mirrors.`,
    questions: [
      'An object 5cm tall is placed 40cm from a convex lens of focal length 15cm. Using the lens formula, calculate (i) the image distance and (ii) the magnification. Describe the nature of the image.',
      'Draw a ray diagram to show image formation when an object is placed between F and 2F of a convex lens. Describe the image formed.',
      'Explain how a concave lens corrects short-sightedness (myopia). Include a simple ray diagram in your answer.'
    ]
  },

  'basics-of-thermodynamics-and-heat-transfer': {
    title: "Thermodynamics — Heat, Energy, and Why Your Tea Gets Cold",
    breakdown: `Thermodynamics is the study of heat, energy, and how they transform. Heat is thermal energy transferred from a hotter object to a cooler one. Temperature is a measure of how hot something is — it tells you the average kinetic energy of the particles. They're related but not the same: a cup of boiling water and a bathtub of warm water might have the same temperature at some point, but the bathtub contains more heat energy because it has more water.

The three methods of heat transfer: Conduction — heat passes through a material from particle to particle (vibrations are passed along). Metals are good conductors because their free electrons transfer energy quickly. Wood and plastic are poor conductors (insulators). Convection — heat transfer in fluids (liquids and gases) by the movement of the heated fluid itself. Heated fluid rises (less dense), cooler fluid sinks to take its place, creating convection currents. This is how your room heats up from a heater in the corner. Radiation — heat transfer through electromagnetic waves (infrared). No medium needed — this is how the sun's heat reaches Earth through the vacuum of space. Specific heat capacity (c) is the energy needed to raise the temperature of 1 kg of a substance by 1°C. Formula: Q = mcΔT, where Q is heat energy (in joules), m is mass, c is specific heat capacity, and ΔT is the temperature change. Water has a high specific heat capacity (4200 J/kg°C), which is why it takes a long time to boil and a long time to cool down.`,
    examRelevance: `WAEC tests heat transfer methods and specific heat capacity calculations every year. Typical: "Calculate the heat energy required to raise the temperature of 2kg of water from 25°C to 100°C" (Q = 2 × 4200 × 75 = 630,000 J). JAMB asks about the three methods of heat transfer and examples: "Heat from the sun reaches Earth by ___" (Answer: radiation). "The handle of a metal spoon in hot soup becomes hot because of ___" (Answer: conduction). NECO tests latent heat — the energy absorbed or released during a change of state (melting or boiling) without temperature change: Q = mL, where L is the specific latent heat. Know the difference between latent heat of fusion (melting/freezing) and latent heat of vaporization (boiling/condensing). WAEC also asks about the zeroth, first, and second laws of thermodynamics at the basic level — energy conservation and the direction of heat flow.`,
    commonTrap: `The most common mistake: confusing heat and temperature. A large block of ice at 0°C can absorb a lot of heat energy before its temperature changes (latent heat). During a phase change (melting or boiling), temperature stays constant even though heat is being added — all the energy goes into breaking intermolecular bonds, not increasing kinetic energy. Students often forget this and assume "adding heat always increases temperature." Another trap: not converting units properly. Make sure mass is in kg (not grams) and temperature change is correct (final minus initial). Also, students sometimes say convection happens in solids. It doesn't — convection requires fluid movement, which only happens in liquids and gases. In solids, heat transfers by conduction only.`,
    questions: [
      'Calculate the total energy needed to convert 0.5 kg of ice at 0°C to steam at 100°C. [Specific heat capacity of water = 4200 J/kg°C, Latent heat of fusion = 334,000 J/kg, Latent heat of vaporization = 2,260,000 J/kg]',
      'Explain why land heats up faster than the sea during the day, and cools down faster at night. How does this create a sea breeze?',
      'A metal rod is heated at one end. Describe, at the particle level, how heat travels to the other end by conduction. Why are metals better conductors than wood?'
    ]
  },

  'simple-harmonic-motion-examples': {
    title: 'Simple Harmonic Motion — The Physics Behind Every Pendulum and Spring',
    breakdown: `Simple Harmonic Motion (SHM) is a type of oscillation where the restoring force is directly proportional to the displacement from the equilibrium position and always directed toward that equilibrium. In plain English: the further you pull something from its resting position, the harder it tries to snap back.

Think of a pendulum swinging. At the center (equilibrium), it's moving fastest and the restoring force is zero. At the extremes (maximum displacement = amplitude), it momentarily stops and the restoring force is maximum, pulling it back. A mass on a spring does the same thing — stretch it, release, and it oscillates back and forth. The key quantities: amplitude (A) — maximum displacement from equilibrium, period (T) — time for one complete oscillation, frequency (f) — number of oscillations per second (f = 1/T). For a simple pendulum, T = 2π√(L/g), where L is the length and g is acceleration due to gravity. Notice: period depends on LENGTH, not on mass or amplitude (for small angles). For a mass on a spring, T = 2π√(m/k), where m is mass and k is the spring constant. Energy in SHM continuously converts between kinetic energy (maximum at equilibrium) and potential energy (maximum at extremes). Total energy remains constant (assuming no friction/damping).`,
    examRelevance: `WAEC tests SHM with both calculations and conceptual questions. "Calculate the period of a simple pendulum of length 1m" (T = 2π√(1/10) = 2π × 0.316 = 1.99 ≈ 2.0 s). JAMB asks: "The period of a simple pendulum depends on ___" (Answer: length and gravitational acceleration, NOT mass or amplitude). WAEC essay questions ask you to describe the energy changes during one complete oscillation — kinetic energy converts to potential energy and back. NECO tests the velocity and acceleration at different points: maximum velocity at equilibrium (v_max = 2πfA), maximum acceleration at the extremes (a_max = 4π²f²A or ω²A). Know the graphs: displacement, velocity, and acceleration vs time are all sinusoidal, but shifted in phase. Displacement and acceleration are always in opposite directions (anti-phase).`,
    commonTrap: `The biggest mistake: saying the period of a pendulum depends on mass or amplitude. For small oscillations, it depends ONLY on length and g. A heavier bob doesn't swing slower. This is counterintuitive and JAMB tests it deliberately. Another trap: confusing velocity and acceleration directions in SHM. Velocity is maximum at the center (equilibrium) and zero at the extremes. Acceleration is maximum at the extremes and zero at the center. They're out of phase. Students also sometimes use the wrong formula for the period — using the pendulum formula for a spring system or vice versa. For a pendulum: T = 2π√(L/g). For a spring: T = 2π√(m/k). Don't swap them. Also, SHM assumes no damping (friction/air resistance). In real life, oscillations gradually decrease in amplitude — that's damped oscillation, and WAEC sometimes asks you to distinguish damped from ideal SHM.`,
    questions: [
      'A simple pendulum has a length of 0.4m. Calculate its period and frequency. [g = 10 m/s²]',
      'Describe the energy transformations that occur during one complete oscillation of a mass-spring system, starting from the maximum displacement.',
      'Two pendulums have the same length but different masses. A student predicts the heavier one will have a longer period. Is this correct? Explain your answer with reference to the formula.'
    ]
  },

  'radioactivity-and-its-applications': {
    title: "Radioactivity — Alpha, Beta, Gamma (And Why Half-Life Isn't Just a Video Game)",
    breakdown: `Radioactivity is the spontaneous emission of particles or energy from an unstable atomic nucleus. Some atoms have nuclei that are just too heavy or have an imbalanced ratio of protons to neutrons, so they emit radiation to become more stable. This process is called radioactive decay, and it's completely random — you can't predict when a specific atom will decay, but you can predict statistically how long it takes for half of a sample to decay. That time is the half-life.

The three types of radiation again (they're that important): Alpha (α) — 2 protons + 2 neutrons (a helium nucleus), stopped by paper, highly ionizing, travels only a few centimeters in air. Beta (β) — a high-speed electron (emitted when a neutron converts to a proton), stopped by a few millimeters of aluminum, moderately ionizing and penetrating. Gamma (γ) — electromagnetic radiation, no mass or charge, reduced by thick lead or concrete, least ionizing but most penetrating. Half-life is the time for half the radioactive atoms in a sample to decay. If you start with 1000 atoms and the half-life is 5 years, after 5 years you have 500 radioactive atoms left, after 10 years you have 250, after 15 years you have 125. The formula: N = N₀ × (½)^(t/t½), where N₀ is the initial amount, t is the elapsed time, and t½ is the half-life. Applications include medical imaging and treatment (technetium-99m for scans, cobalt-60 for cancer treatment), carbon-14 dating for archaeology, smoke detectors (americium-241), and industrial thickness gauging.`,
    examRelevance: `WAEC and JAMB test radioactivity frequently. Half-life calculations are almost guaranteed: "A radioactive substance has a half-life of 8 days. What fraction remains after 32 days?" (32/8 = 4 half-lives, so (½)⁴ = 1/16 remains). JAMB loves property comparison questions: "Which radiation has the highest penetrating power?" (gamma). "Which is deflected towards the positive plate in an electric field?" (beta, because it's negatively charged). WAEC essay questions ask about safety precautions when handling radioactive materials (use tongs/long forceps, store in lead-lined containers, minimize exposure time, wear monitoring badges) and the applications of radioactivity. NECO tests nuclear equations: for alpha decay, atomic number decreases by 2 and mass number by 4; for beta decay, atomic number increases by 1 and mass number stays the same.`,
    commonTrap: `Students often say "after two half-lives, all the substance has decayed." No — after one half-life, half remains. After two half-lives, one-quarter remains (half of a half). After three, one-eighth. It never fully reaches zero (mathematically). Another mistake: saying gamma rays are "not dangerous because they're not ionizing." Gamma rays ARE ionizing — just less so per unit length than alpha. But because they penetrate deep into the body, they can damage internal organs. Alpha particles are more ionizing but are stopped by skin, so they're mainly dangerous if ingested or inhaled. Also, students confuse half-life with "shelf life" or assume that after the half-life, the substance is "safe." A substance with a very long half-life (like uranium-238 with 4.5 billion years) is actually LESS intensely radioactive at any moment because it decays slowly. Short half-life = decays quickly = more intense radiation over a short period.`,
    questions: [
      'A radioactive element has a half-life of 20 minutes. If you start with 160g, calculate the mass remaining after 1 hour.',
      'Explain why alpha radiation is considered more dangerous than gamma radiation if the source is inhaled or ingested, even though gamma is more penetrating.',
      'A hospital uses a radioactive tracer with a half-life of 6 hours to image a patient\'s thyroid. Explain why a short half-life is preferred for medical tracers.'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  MATHEMATICS (8)
  // ═══════════════════════════════════════════════════════════════════════════

  'how-to-solve-quadratic-equations': {
    title: "Quadratic Equations — Three Ways to Solve Them (Pick Your Weapon)",
    breakdown: `A quadratic equation is any equation that can be written in the form ax² + bx + c = 0, where a ≠ 0. The highest power of x is 2 — that's what makes it "quadratic." These equations always have at most two solutions (roots), and there are three main methods to find them.

Method 1: Factoring. If you can express ax² + bx + c as a product of two brackets, you're golden. Example: x² + 5x + 6 = 0 becomes (x + 2)(x + 3) = 0, so x = -2 or x = -3. This is the fastest method but only works when the factors are nice whole numbers. Method 2: Completing the Square. Take x² + bx, add and subtract (b/2)² to create a perfect square. Example: x² + 6x + 2 = 0 → (x + 3)² - 9 + 2 = 0 → (x + 3)² = 7 → x = -3 ± √7. This method always works and is the basis for deriving the quadratic formula. Method 3: The Quadratic Formula. x = (-b ± √(b² - 4ac)) / 2a. Plug in a, b, and c from your equation and calculate. This ALWAYS works, even when factoring doesn't. The discriminant (b² - 4ac) tells you about the roots: if it's positive, you get two distinct real roots; if it's zero, one repeated root; if it's negative, no real roots (the parabola doesn't cross the x-axis). WAEC expects you to be fluent in all three methods.`,
    examRelevance: `Quadratic equations appear in WAEC, JAMB, NECO, and GCE — literally every major Nigerian exam. You'll solve them directly, form them from word problems, and use them in coordinate geometry. JAMB loves: "Solve x² - 5x + 6 = 0" (factoring gives x = 2 or x = 3). WAEC often specifies which method to use: "Solve 2x² + 3x - 2 = 0 using the quadratic formula." NECO asks about the discriminant: "Determine the nature of the roots of x² + 4x + 5 = 0" (discriminant = 16 - 20 = -4, so no real roots). WAEC also asks you to form quadratic equations from given roots: if the roots are α and β, the equation is x² - (α+β)x + αβ = 0. This connects to the sum and product of roots, which is a frequent exam topic.`,
    commonTrap: `The number one mistake: sign errors, especially with the quadratic formula. When b is negative, -b becomes positive. Students who rush through the formula drop negatives or mess up the ± sign. Write it out carefully every time. Another trap: forgetting that a = coefficient of x², b = coefficient of x, c = constant term. If the equation is 3x² - 7x = 2, you must rearrange to 3x² - 7x - 2 = 0 before identifying a = 3, b = -7, c = -2. Also, when factoring, students sometimes find one root and forget the other. Quadratic equations have TWO roots (though they might be equal). And when using the formula, don't forget to divide the ENTIRE numerator by 2a, not just part of it.`,
    questions: [
      'Solve the equation 2x² - 7x + 3 = 0 by factoring. Verify your answers by substitution.',
      'Solve x² + 4x - 1 = 0 by completing the square. Leave your answer in surd form.',
      'Without solving, determine the nature of the roots of 3x² + 2x + 5 = 0. What does the discriminant tell you about the graph of y = 3x² + 2x + 5?'
    ]
  },

  'differentiation-in-calculus-explained': {
    title: "Differentiation — Finding the Slope When the Curve Won't Sit Still",
    breakdown: `Differentiation is the process of finding the rate at which something changes. In math terms, it gives you the gradient (slope) of a curve at any point. The result of differentiating a function is called its derivative. If y = f(x), the derivative is written as dy/dx or f'(x).

The basic rule is the power rule: if y = xⁿ, then dy/dx = nxⁿ⁻¹. Bring the power down, reduce it by one. So y = x³ gives dy/dx = 3x². y = 5x⁴ gives dy/dx = 20x³. The derivative of a constant is 0 (a horizontal line has zero slope). For sums: differentiate each term separately. y = 3x² + 2x + 7 gives dy/dx = 6x + 2 + 0 = 6x + 2. The chain rule handles composite functions: if y = (2x + 1)⁵, let u = 2x + 1, so y = u⁵. Then dy/dx = dy/du × du/dx = 5u⁴ × 2 = 10(2x + 1)⁴. Applications of differentiation include finding the gradient at a specific point, finding equations of tangents and normals, finding maximum and minimum values (where dy/dx = 0), and solving optimization problems. At a maximum, d²y/dx² < 0 (concave down). At a minimum, d²y/dx² > 0 (concave up). These turning points are where the function changes direction, and finding them is a common exam question.`,
    examRelevance: `Differentiation is a core WAEC and JAMB further mathematics topic. Basic differentiation using the power rule appears in WAEC general mathematics too. JAMB asks: "If y = 3x³ - 2x² + x - 1, find dy/dx" (Answer: 9x² - 4x + 1). WAEC often asks you to find the gradient of a curve at a specific point, or to find the coordinates of turning points: "Find the maximum and minimum values of y = x³ - 3x² + 4." To solve: dy/dx = 3x² - 6x = 0, so x = 0 or x = 2. Then check d²y/dx² to determine which is max and which is min. NECO tests practical applications: rates of change, velocity and acceleration (velocity = ds/dt, acceleration = dv/dt). The chain rule and product rule are tested in further mathematics papers.`,
    commonTrap: `The most common mistake: forgetting to reduce the power by 1. Students compute the coefficient correctly (multiply by the power) but leave the power unchanged. For y = x⁴, the derivative is 4x³, not 4x⁴. Another trap: differentiating constants. The derivative of y = 7 is 0, not 7 or 1. A constant has no x, so there's nothing to differentiate. Students also confuse finding dy/dx = 0 (which gives the x-values of turning points) with finding the actual maximum or minimum VALUES of y. After finding x, you must substitute back into the original equation to get y. Finally, don't forget to use the second derivative test to determine the NATURE of the turning point — WAEC specifically asks "determine whether it is a maximum or minimum."`,
    questions: [
      'Differentiate y = 4x³ - 6x² + 2x - 9. Find the gradient of the curve at x = 2.',
      'Find the coordinates of the turning points of y = 2x³ - 9x² + 12x - 4. Determine the nature of each turning point using the second derivative test.',
      'A particle moves along a straight line such that its displacement s (in meters) after t seconds is given by s = t³ - 6t² + 9t + 2. Find (i) the velocity at t = 2s, and (ii) the time at which the acceleration is zero.'
    ]
  },

  'integration-formulas-and-examples': {
    title: "Integration — Differentiation's Cooler Older Sibling",
    breakdown: `Integration is the reverse of differentiation. If differentiation breaks things down (finding the rate of change), integration builds things up (finding the total, the area, the accumulation). If dy/dx = 3x², then integrating gives y = x³ + C. That "+C" is the constant of integration — it's there because when you differentiate a constant, you get zero, so you can't know what constant was originally there unless you have more information.

The basic rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (as long as n ≠ -1). Add 1 to the power, divide by the new power. So ∫x² dx = x³/3 + C. ∫4x³ dx = x⁴ + C. For sums, integrate each term separately. That's indefinite integration — finding the general antiderivative. Definite integration has limits (upper and lower bounds) and gives you a number — specifically, the area under the curve between those bounds. ∫ from a to b of f(x) dx = [F(x)] from a to b = F(b) - F(a). Example: ∫ from 1 to 3 of x² dx = [x³/3] from 1 to 3 = (27/3) - (1/3) = 26/3. Area under a curve is one of the most important applications. Other applications include finding the volume of revolution, the distance from velocity, and the work done by a variable force.`,
    examRelevance: `Integration appears in WAEC further mathematics and JAMB. Basic integration (power rule) is also tested in WAEC general math for some syllabi. JAMB asks: "Evaluate ∫(3x² + 2x) dx" (Answer: x³ + x² + C). WAEC loves area-under-the-curve questions: "Find the area bounded by the curve y = x² + 1, the x-axis, and the lines x = 0 and x = 3." NECO tests definite integrals with substitution: "Evaluate ∫ from 0 to 2 of (2x + 1)³ dx." Know how to handle negative areas — if the curve goes below the x-axis, the integral gives a negative value, so take the absolute value for the actual area. UTME sometimes asks about the relationship between integration and differentiation — that they're inverse operations.`,
    commonTrap: `The most common mistake: forgetting the constant of integration (+C) in indefinite integrals. This is an automatic mark deduction in WAEC. ALWAYS write +C unless you're doing a definite integral (where the constant cancels out). Another trap: adding 1 to the power but forgetting to divide by the new power. For ∫x³ dx, you get x⁴/4, not x⁴. Also, students get confused with the formula when n = -1: ∫x⁻¹ dx = ∫(1/x) dx = ln|x| + C, NOT x⁰/0 (which is undefined). For definite integrals, a common error is subtracting in the wrong order — it's F(upper limit) minus F(lower limit), always. And when finding area between a curve and the x-axis, remember to check if the curve crosses the x-axis between your limits — you may need to split the integral and take absolute values.`,
    questions: [
      'Evaluate ∫(4x³ - 6x + 2) dx.',
      'Find the area enclosed between the curve y = x² - 4, the x-axis, and the lines x = -2 and x = 3. [Hint: Check where the curve crosses the x-axis.]',
      'The velocity of a particle is given by v = 3t² - 6t + 2 m/s. Find the displacement of the particle between t = 1s and t = 4s.'
    ]
  },

  'matrices-operations-and-determinants': {
    title: "Matrices — It's Just Organized Numbers (With Superpowers)",
    breakdown: `A matrix is a rectangular arrangement of numbers in rows and columns. A 2×2 matrix has 2 rows and 2 columns. Matrices aren't just organized numbers — they're incredibly powerful tools for solving systems of equations, transformations in geometry, and a ton of applications in computer science and engineering.

Matrix addition and subtraction: just add or subtract corresponding elements. Both matrices must be the same size. Matrix multiplication: this is where it gets interesting. To multiply two matrices, the number of columns in the first must equal the number of rows in the second. For a 2×2 case: if A = [[a,b],[c,d]] and B = [[e,f],[g,h]], then AB = [[ae+bg, af+bh],[ce+dg, cf+dh]]. Each element is the dot product of a row from A and a column from B. Note: AB ≠ BA in general (matrix multiplication is NOT commutative). The determinant of a 2×2 matrix [[a,b],[c,d]] is ad - bc. If the determinant is 0, the matrix has no inverse (it's singular). If it's non-zero, the inverse exists: A⁻¹ = (1/det) × [[d,-b],[-c,a]]. Swap the main diagonal, negate the off-diagonal, divide by the determinant. The inverse is crucial for solving simultaneous equations in matrix form: if AX = B, then X = A⁻¹B.`,
    examRelevance: `WAEC and JAMB test 2×2 matrices heavily. Common questions: "Find the determinant of the matrix [[3,2],[5,4]]" (Answer: 3×4 - 2×5 = 12 - 10 = 2). "Find the inverse of [[4,3],[2,1]]" (determinant = 4-6 = -2, inverse = (-1/2)[[1,-3],[-2,4]]). JAMB loves: "If A = [[1,2],[3,4]] and B = [[5,6],[7,8]], find AB." WAEC often asks you to use matrices to solve simultaneous equations: express 2x + 3y = 7 and x + 2y = 4 as AX = B, find A⁻¹, then compute X = A⁻¹B. NECO tests when a matrix is singular (determinant = 0) and what that means for the system of equations (no unique solution). Know 2×2 operations cold — addition, subtraction, multiplication, determinant, inverse, and application to simultaneous equations.`,
    commonTrap: `The biggest mistake in matrix multiplication: students add elements instead of using dot products. In the product AB, each element is a SUM OF PRODUCTS — you multiply corresponding elements of a row from A and a column from B, then add them up. It's not element-by-element multiplication. Another trap: assuming AB = BA. Matrix multiplication is generally NOT commutative. AB and BA can be completely different matrices (or one might not even exist if dimensions don't match). When finding the inverse, students often forget to swap the main diagonal elements or to change the signs of the off-diagonal elements. The formula: swap a and d, negate b and c, divide everything by the determinant. And if the determinant is zero, STOP — there is no inverse. Students sometimes try to divide by zero here, which is a mathematical crime.`,
    questions: [
      'Given A = [[2,3],[1,4]] and B = [[1,0],[2,5]], calculate (i) AB and (ii) BA. Is AB = BA?',
      'Find the inverse of the matrix [[3,5],[2,4]]. Verify your answer by showing that AA⁻¹ = I (the identity matrix).',
      'Use matrix methods to solve the simultaneous equations: 3x + 2y = 12 and 5x + 3y = 19.'
    ]
  },

  'probability-questions-and-solutions': {
    title: "Probability — What Are the Chances? (Let's Actually Calculate It)",
    breakdown: `Probability measures how likely an event is to happen. It ranges from 0 (impossible) to 1 (certain). The basic formula: P(event) = number of favorable outcomes / total number of possible outcomes. If you roll a fair die, P(getting a 4) = 1/6, because there's one 4 out of six possible outcomes.

For combined events, there are two key rules. The Addition Rule (OR): P(A or B) = P(A) + P(B) - P(A and B). If events are mutually exclusive (can't happen at the same time), then P(A and B) = 0, so P(A or B) = P(A) + P(B). Example: P(rolling a 2 OR a 5) = 1/6 + 1/6 = 2/6 = 1/3. The Multiplication Rule (AND): P(A and B) = P(A) × P(B|A). If events are independent (one doesn't affect the other), then P(B|A) = P(B), so P(A and B) = P(A) × P(B). Example: P(getting heads on two coin flips) = 1/2 × 1/2 = 1/4. Conditional probability P(B|A) is the probability of B given that A has already happened. Tree diagrams are incredibly helpful for visualizing multi-stage probability problems — draw branches for each outcome, multiply along branches for AND, add between branches for OR. Permutations (order matters): ⁿPᵣ = n!/(n-r)!. Combinations (order doesn't matter): ⁿCᵣ = n!/[r!(n-r)!].`,
    examRelevance: `Probability is in every WAEC, JAMB, NECO, and GCE paper. It's unavoidable. Basic probability questions: "A bag contains 5 red and 3 blue balls. One ball is drawn at random. Find the probability that it is red" (5/8). JAMB loves questions with replacement vs without replacement — these change whether events are independent. "Two balls are drawn without replacement from a bag containing 4 white and 6 black balls. Find the probability that both are white" (4/10 × 3/9 = 12/90 = 2/15). WAEC sets longer problems involving tree diagrams for three-stage experiments. NECO tests permutations and combinations: "In how many ways can 5 books be arranged on a shelf?" (5! = 120). Know the complement rule: P(not A) = 1 - P(A). This is often the fastest way to solve "at least one" problems.`,
    commonTrap: `The biggest mistake: not reading whether the question says "with replacement" or "without replacement." With replacement, events are independent and probabilities stay the same. Without replacement, probabilities change because the total number of outcomes decreases. Another trap: adding probabilities when you should multiply (or vice versa). Use addition for OR, multiplication for AND. A tree diagram helps you avoid this confusion — just follow the branches. Also, students confuse permutations and combinations. If the question asks "how many ways can you ARRANGE" — that's permutation (order matters). If it asks "how many ways can you CHOOSE" or "SELECT" — that's combination (order doesn't matter). ⁵C₂ = 10 (choosing 2 from 5), but ⁵P₂ = 20 (arranging 2 from 5).`,
    questions: [
      'A bag contains 7 red, 5 blue, and 3 green marbles. Two marbles are drawn without replacement. Find the probability that (i) both are red, (ii) they are of different colors.',
      'Three coins are tossed simultaneously. Using a tree diagram or otherwise, find the probability of getting (i) exactly two heads, (ii) at least one tail.',
      'A committee of 3 is to be selected from 5 men and 4 women. In how many ways can the committee be formed if it must include at least one woman?'
    ]
  },

  'trigonometry-formulas-and-identities': {
    title: "Trigonometry — SOH CAH TOA and Beyond",
    breakdown: `Trigonometry starts with right-angled triangles and the three ratios: Sine (sin) = Opposite/Hypotenuse, Cosine (cos) = Adjacent/Hypotenuse, Tangent (tan) = Opposite/Adjacent. SOH CAH TOA. With these three ratios, you can find any missing side or angle in a right-angled triangle if you know enough information.

But trig goes way beyond right triangles. The unit circle extends these ratios to ALL angles — even angles bigger than 90° or negative angles. On the unit circle, for any angle θ: cos θ = x-coordinate, sin θ = y-coordinate, tan θ = sin θ / cos θ. The key trig identities you must know: sin²θ + cos²θ = 1 (the Pythagorean identity — works for EVERY angle), tan θ = sin θ / cos θ, and sec²θ = 1 + tan²θ. For non-right triangles, use the Sine Rule: a/sin A = b/sin B = c/sin C (when you have a side-angle pair), and the Cosine Rule: a² = b² + c² - 2bc cos A (when you have two sides and the included angle, or all three sides). Special angles to memorize: sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3, sin 45° = cos 45° = 1/√2, tan 45° = 1, sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3. These come up in almost every exam.`,
    examRelevance: `Trigonometry is everywhere in WAEC and JAMB math. You'll use it in geometry, coordinate geometry, calculus, and even physics. JAMB asks straightforward calculations: "If sin θ = 3/5, find cos θ" (using sin²θ + cos²θ = 1: cos θ = 4/5). WAEC tests the sine and cosine rules in non-right triangle problems: "In triangle ABC, a = 7cm, b = 5cm, angle C = 60°. Find c." NECO tests trig identities: "Prove that (1 - sin²θ)/cos θ = cos θ" (since 1 - sin²θ = cos²θ, so cos²θ/cos θ = cos θ). WAEC also tests trigonometric equations: "Solve 2sin θ - 1 = 0 for 0° ≤ θ ≤ 360°" (sin θ = 1/2, so θ = 30° or 150°). Know which quadrants each trig function is positive in (All Students Take Chemistry: All positive in Q1, Sin in Q2, Tan in Q3, Cos in Q4).`,
    commonTrap: `The most common mistake: using trig ratios on non-right triangles without the sine or cosine rule. SOH CAH TOA only works for right-angled triangles. For other triangles, you need the sine rule or cosine rule. Another trap: when solving trig equations, students find one solution and forget the others. If sin θ = 1/2, θ = 30° is only one answer. In the range 0° to 360°, θ = 150° is also a solution (sin is positive in Q1 and Q2). Always check how many solutions exist in the given range. Students also sometimes confuse degrees and radians — make sure your calculator is in the right mode. And when using the cosine rule, don't forget the minus sign: a² = b² + c² - 2bc cos A. Dropping that negative sign gives a completely wrong answer.`,
    questions: [
      'If tan θ = 5/12 and θ is acute, find the values of sin θ and cos θ without using a calculator.',
      'In triangle PQR, PQ = 8cm, QR = 6cm, and angle PQR = 120°. Calculate the length of PR using the cosine rule.',
      'Solve 2cos²θ - cosθ - 1 = 0 for 0° ≤ θ ≤ 360°.'
    ]
  },

  'sequences-and-series-arithmetic-geometric': {
    title: "Sequences and Series — Finding the Pattern (And the Sum)",
    breakdown: `A sequence is an ordered list of numbers following a rule. A series is the sum of the terms of a sequence. The two most important types are arithmetic sequences (AP) and geometric sequences (GP).

An Arithmetic Progression (AP) has a constant difference between consecutive terms. Like 2, 5, 8, 11, 14... (common difference d = 3). The nth term: Tₙ = a + (n-1)d, where a is the first term. The sum of the first n terms: Sₙ = n/2 × [2a + (n-1)d] or Sₙ = n/2 × (first term + last term). A Geometric Progression (GP) has a constant ratio between consecutive terms. Like 3, 6, 12, 24, 48... (common ratio r = 2). The nth term: Tₙ = arⁿ⁻¹. The sum of the first n terms: Sₙ = a(rⁿ - 1)/(r - 1) when r > 1, or Sₙ = a(1 - rⁿ)/(1 - r) when r < 1. If |r| < 1, the GP converges and the sum to infinity exists: S∞ = a/(1-r). This is huge — it means you can add up infinitely many terms and get a finite answer. For example, 1 + 1/2 + 1/4 + 1/8 + ... = 1/(1 - 1/2) = 2. Magic.`,
    examRelevance: `Sequences and series are tested in WAEC, JAMB, and UTME every year. JAMB loves: "Find the 10th term of the AP 3, 7, 11, 15..." (a = 3, d = 4, T₁₀ = 3 + 9×4 = 39). "Find the sum of the first 20 terms of the AP 1, 4, 7, 10..." WAEC asks about geometric progressions: "The 3rd term of a GP is 18 and the 6th term is 486. Find the first term and common ratio." (Set up ar² = 18 and ar⁵ = 486, divide to get r³ = 27, so r = 3, then a = 2). NECO tests the sum to infinity: "Find the sum to infinity of the GP 8, 4, 2, 1, ..." (a = 8, r = 1/2, S∞ = 8/(1-0.5) = 16). Word problems involving AP and GP are common in WAEC — growth patterns, savings plans, depreciation. Know how to identify whether a sequence is AP (constant difference) or GP (constant ratio).`,
    commonTrap: `Students often use the wrong formula — applying AP formulas to GP problems or vice versa. Always check: is the difference constant (AP) or the ratio constant (GP)? Another trap: in the nth term formula, students forget it's (n-1), not n. The first term is T₁ = a + (1-1)d = a, not a + d. That's the second term. For GP, students sometimes confuse the sum formula for r > 1 with the one for r < 1 — both are correct, just rearranged for convenience. Either works mathematically, but using the wrong one can lead to negative results that confuse you. For sum to infinity, remember it only works when |r| < 1. If |r| ≥ 1, the series diverges and the sum to infinity doesn't exist. WAEC has specifically asked "does this GP converge?" as a preliminary question before asking for the sum.`,
    questions: [
      'The 5th and 12th terms of an AP are 19 and 54 respectively. Find the first term, common difference, and the 20th term.',
      'A GP has first term 4 and common ratio 1/3. Find (i) the 6th term, (ii) the sum of the first 8 terms, and (iii) the sum to infinity.',
      'The sum of the first three terms of a GP is 21 and the sum of the next three terms is 168. Find the first term and common ratio.'
    ]
  },

  'logarithms-rules-and-how-to-solve': {
    title: "Logarithms — The Reverse Button for Exponents",
    breakdown: `A logarithm answers the question: "What power do I need to raise the base to, in order to get this number?" If 10² = 100, then log₁₀ 100 = 2. If 2³ = 8, then log₂ 8 = 3. The logarithm is the exponent. It's the inverse of exponentiation.

The three fundamental log rules make calculations much easier. Product Rule: log(AB) = log A + log B. Multiplication inside the log becomes addition outside. Quotient Rule: log(A/B) = log A - log B. Division inside becomes subtraction outside. Power Rule: log(Aⁿ) = n log A. The exponent comes down as a multiplier. These rules let you simplify complex expressions and solve equations where the variable is in the exponent. For example, to solve 2ˣ = 16, take log of both sides: x log 2 = log 16, so x = log 16 / log 2 = 4. The Change of Base Formula: log_a b = log_c b / log_c a. This is how you evaluate logs with any base using your calculator (which only has log₁₀ and ln). Common logarithm: log₁₀ (written as log). Natural logarithm: logₑ (written as ln, where e ≈ 2.718). Also remember: log_a a = 1 (any base to the power 1 equals itself), log_a 1 = 0 (any base to the power 0 equals 1), and log_a (aⁿ) = n.`,
    examRelevance: `Logarithms are in WAEC, JAMB, and NECO every single year. WAEC loves: "Simplify log₁₀ 25 + log₁₀ 4" (= log₁₀ (25×4) = log₁₀ 100 = 2). "Solve for x: log₃ (2x-1) = 2" (3² = 2x-1, 9 = 2x-1, x = 5). JAMB tests the log rules in calculation form: "Evaluate log₂ 32 - log₂ 4" (= log₂(32/4) = log₂ 8 = 3). NECO asks about the change of base formula and using logarithm tables (yes, some syllabi still use log tables). WAEC also tests equations like 3^(2x+1) = 27^(x-1): express both sides with the same base (27 = 3³), so 3^(2x+1) = 3^(3x-3), therefore 2x+1 = 3x-3, x = 4. Know how to convert between logarithmic and exponential form — it's the foundation of every log question.`,
    commonTrap: `The most common mistake: treating log(A + B) as log A + log B. WRONG. There is NO rule for the log of a sum. log(A + B) ≠ log A + log B. The product rule says log(A × B) = log A + log B. Students confuse multiplication with addition constantly. Another trap: forgetting that you can't take the log of a negative number or zero. log(0) and log(-5) are undefined for real numbers. When solving log equations, always check that your solution doesn't make the argument of any log negative or zero. Also, students mess up the change of base formula direction: log_a b = log b / log a, NOT log a / log b. And when solving equations like log x + log(x-3) = 1, students sometimes forget that this means log₁₀[x(x-3)] = 1, so x(x-3) = 10, giving x² - 3x - 10 = 0, which has solutions x = 5 and x = -2. But x = -2 is invalid because log(-2) is undefined. Always check your solutions.`,
    questions: [
      'Simplify without using tables or calculator: 2 log₁₀ 5 + log₁₀ 8 - log₁₀ 2.',
      'Solve for x: log₂(x+3) + log₂(x-3) = 4. Remember to check the validity of your solutions.',
      'Use the change of base formula to evaluate log₈ 32, expressing your answer as a fraction.'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ECONOMICS (6)
  // ═══════════════════════════════════════════════════════════════════════════

  'law-of-demand-and-supply-explained': {
    title: "Demand and Supply — The Two Curves That Explain Everything in Economics",
    breakdown: `Demand is how much of a product consumers are willing and able to buy at different prices. The law of demand says: as price goes up, quantity demanded goes down (and vice versa), all other things being equal. Makes sense — if garri suddenly costs ₦5,000 per bag, you're buying less garri. The demand curve slopes downward from left to right.

Supply is how much producers are willing and able to sell at different prices. The law of supply says: as price goes up, quantity supplied goes up. If garri is selling for ₦5,000, every farmer and their uncle wants to sell garri. The supply curve slopes upward from left to right. Where the two curves meet is the equilibrium — the market price and quantity where demand equals supply. No surplus, no shortage. But things shift. If everyone suddenly discovers garri is a superfood (change in taste/preference), demand increases — the demand curve shifts RIGHT, price goes up. If there's a bumper harvest (better technology), supply increases — supply curve shifts RIGHT, price goes down. Know the difference between a movement ALONG the curve (caused by a change in the product's own price) and a SHIFT of the curve (caused by changes in other factors like income, preferences, prices of related goods, technology, government policy).`,
    examRelevance: `Demand and supply is the backbone of WAEC economics. You'll draw the curves, explain shifts, identify equilibrium, and analyze what happens when the government sets price floors or ceilings. JAMB asks: "What causes a movement along a demand curve?" (Answer: a change in the price of the good itself). "What causes a shift in the supply curve?" (Answer: changes in technology, cost of production, government subsidies/taxes, etc.). WAEC essay questions are often scenario-based: "The price of rice increased by 40%. Explain, with a diagram, the effect on the demand for garri (a substitute)." NECO tests excess demand (shortage — when price is below equilibrium) and excess supply (surplus — when price is above equilibrium). Draw diagrams neatly — WAEC marks are allocated specifically for labeled diagrams.`,
    commonTrap: `The most common mistake: confusing a shift of the curve with a movement along the curve. A change in the product's OWN price causes movement along the curve. EVERYTHING ELSE (income, tastes, related goods' prices, expectations, population) causes a shift of the curve. Drawing a shift when you should show a movement (or vice versa) is an instant mark loss. Another trap: drawing the demand curve sloping upward. Demand curves slope DOWNWARD. Supply curves slope UPWARD. Getting this wrong invalidates your entire diagram. Also, students often forget to label their axes (Price on vertical, Quantity on horizontal) and curves (D₁, D₂, S₁, S₂). In WAEC, unlabeled diagrams lose marks even if the shape is correct. And remember: "demand" is not the same as "quantity demanded." Demand refers to the entire schedule/curve. Quantity demanded is a specific amount at a specific price.`,
    questions: [
      'Using a clearly labeled diagram, explain what happens to the equilibrium price and quantity in the market for beans if the price of rice (a substitute) increases significantly.',
      'Distinguish between a "change in demand" and a "change in quantity demanded." Give an example of a factor that causes each.',
      'The government imposes a minimum price (price floor) above the equilibrium price for maize. Using a diagram, explain the likely effects on the market.'
    ]
  },

  'price-elasticity-of-demand-examples': {
    title: "Elasticity — Why Some Prices Make You Switch and Others Don't",
    breakdown: `Elasticity measures how sensitive one variable is to changes in another. Price Elasticity of Demand (PED) is the most common type — it measures how much the quantity demanded changes when price changes. Formula: PED = % change in quantity demanded / % change in price. If the price of pure water goes up by 10% and people buy 20% less, PED = -20/10 = -2. The negative sign is because demand and price move in opposite directions (law of demand).

If |PED| > 1, demand is elastic — quantity demanded is very sensitive to price changes (luxury goods, goods with many substitutes). If |PED| < 1, demand is inelastic — quantity demanded barely changes when price changes (necessities like salt, fuel, medicines). If |PED| = 1, demand is unit elastic. What makes demand elastic or inelastic? Availability of substitutes (more substitutes = more elastic), necessity vs luxury (necessities are inelastic), proportion of income spent (expensive items are more elastic), time period (demand is more elastic over time as people find alternatives), and brand loyalty. Income Elasticity of Demand (YED) = % change in quantity demanded / % change in income. Positive YED = normal good. Negative YED = inferior good. Cross Elasticity of Demand (XED) = % change in quantity demanded of A / % change in price of B. Positive XED = substitutes. Negative XED = complements.`,
    examRelevance: `Elasticity appears in WAEC and JAMB regularly. Calculations are common: "The price of a commodity rose from ₦200 to ₦240 and quantity demanded fell from 500 to 400 units. Calculate the PED" (% change in Q = -100/500 × 100 = -20%, % change in P = 40/200 × 100 = 20%, PED = -20/20 = -1). JAMB tests the factors affecting elasticity: "Demand for salt is inelastic because ___" (it's a necessity with no close substitutes and takes a small proportion of income). WAEC essay questions ask about the significance of elasticity for business pricing decisions and government taxation. If demand is inelastic, a tax on the product will raise revenue without significantly reducing consumption. If demand is elastic, a price increase will cause a large drop in sales. NECO tests cross and income elasticity — know how to interpret the sign and magnitude.`,
    commonTrap: `Students often forget the negative sign in PED or get confused about whether to ignore it. By convention, PED is negative (because demand curves slope downward), but when comparing elasticity, we use the absolute value. |PED| > 1 is elastic, |PED| < 1 is inelastic. Another trap: calculating percentage changes incorrectly. Use the original value as the denominator: % change = (new - old) / old × 100. Some questions use the midpoint method, so read carefully. Students also confuse elastic with inelastic — elastic means responsive (quantity changes a LOT when price changes), not that it stretches or is flexible in some vague way. And don't mix up PED, YED, and XED. Each uses a different variable in the denominator: price of the good (PED), income (YED), price of another good (XED). Using the wrong formula gives you the wrong type of elasticity entirely.`,
    questions: [
      'The price of a product fell from ₦500 to ₦400 and the quantity demanded rose from 200 to 280 units. Calculate the price elasticity of demand and state whether demand is elastic or inelastic.',
      'Explain why the government would prefer to impose indirect taxes on goods with inelastic demand rather than elastic demand.',
      'If the cross elasticity of demand between goods A and B is -0.5, what is the relationship between A and B? If the price of B increases by 20%, what is the expected change in demand for A?'
    ]
  },

  'gdp-and-national-income-calculation': {
    title: "GDP and National Income — Measuring How Rich (or Broke) a Country Really Is",
    breakdown: `Gross Domestic Product (GDP) is the total value of all goods and services produced within a country's borders in a given period (usually a year). It's the most common way to measure the size of an economy. If Nigeria's GDP is $400 billion, that means $400 billion worth of stuff was produced inside Nigeria that year — including output by foreign companies operating in Nigeria.

Gross National Product (GNP) is different: it's the total value of goods and services produced by a country's citizens, wherever they are in the world. GNP = GDP + net income from abroad (income earned by Nigerians abroad minus income earned by foreigners in Nigeria). Net National Product (NNP) = GNP - depreciation (wear and tear on capital goods). National Income (NI) = NNP - indirect taxes + subsidies. These are the four measures you need to know. GDP can be calculated three ways: the Output method (sum of value added by all industries), the Income method (sum of all incomes — wages, profits, rents, interest), and the Expenditure method (C + I + G + (X-M), where C = consumption, I = investment, G = government spending, X = exports, M = imports). Per capita income = national income / population. It's a rough indicator of living standards — but it hides inequality. A country with high GDP but extreme inequality might have most citizens living poorly.`,
    examRelevance: `WAEC tests national income in both objective and essay sections. Common questions: "Define GDP" and "Distinguish between GDP and GNP." JAMB loves: "GDP at market price minus depreciation equals ___" (Answer: NDP at market price). "The formula for GDP using the expenditure approach is ___" (C + I + G + X - M). WAEC essay questions ask about the problems of measuring national income: double counting (must use value added, not total output), subsistence production (unpaid farm work isn't counted), the informal sector (market women, okada riders — huge in Nigeria but largely uncounted), and non-monetary transactions. NECO tests the uses and limitations of per capita income as a measure of living standards. Know why GDP alone doesn't tell you about quality of life, income distribution, environmental sustainability, or non-market production.`,
    commonTrap: `The biggest mistake: confusing GDP and GNP. GDP = within the country's borders (territorial). GNP = by the country's citizens (national). A Toyota factory in Lagos contributes to Nigeria's GDP but Japan's GNP. Another trap: double counting in the output method. If you count the value of wheat, the value of flour, and the value of bread separately, you're counting the wheat three times. You must count only the VALUE ADDED at each stage, or count only the value of the final product. Students also forget that GDP doesn't account for the informal sector, which in Nigeria is estimated at 40-60% of real economic activity. This means Nigeria's "true" GDP is significantly higher than official figures suggest. And don't confuse "real GDP" (adjusted for inflation) with "nominal GDP" (at current prices). Real GDP gives a more accurate picture of actual growth.`,
    questions: [
      'Clearly distinguish between GDP, GNP, and NNP. If Nigeria\'s GDP is ₦150 trillion, net income from abroad is -₦5 trillion, and depreciation is ₦10 trillion, calculate the GNP and NNP.',
      'Explain the expenditure approach to measuring national income. What does each component (C, I, G, X-M) represent?',
      'State four limitations of using per capita income to compare living standards between Nigeria and another country.'
    ]
  },

  'causes-and-effects-of-inflation': {
    title: "Inflation — Why ₦1,000 Doesn't Buy What It Used To",
    breakdown: `Inflation is a sustained increase in the general price level of goods and services in an economy over time. When inflation happens, each unit of currency buys fewer things. That ₦1,000 that bought a full plate of rice and chicken in 2015 barely gets you rice alone today. That's inflation eating into the value of money.

There are two main causes. Demand-pull inflation: too much money chasing too few goods. When the economy is booming and everyone has money to spend, demand outpaces supply and prices rise. It's like when everyone wants to buy the new iPhone on launch day — sellers can charge more because demand is high. Cost-push inflation: the cost of producing goods increases (raw materials get more expensive, wages rise, fuel costs go up), and producers pass these costs to consumers through higher prices. In Nigeria, when fuel prices increase, transportation costs go up, which means food prices go up, which means everything goes up — that's cost-push inflation in action. Effects of inflation: it reduces the purchasing power of money (bad for people on fixed incomes like pensioners), it can discourage savings (why save money that's losing value?), it creates uncertainty for businesses, and it can redistribute income (debtors benefit because they repay loans with "cheaper" money, while creditors lose out). Control measures include tight monetary policy (raising interest rates, reducing money supply) and tight fiscal policy (reducing government spending, increasing taxes).`,
    examRelevance: `Inflation is a WAEC and JAMB staple, especially as an essay question. WAEC often asks: "Explain the causes, effects, and control measures of inflation in West Africa." Structure your answer around demand-pull causes, cost-push causes, at least four effects, and at least three control measures. JAMB tests definitions and types: "Demand-pull inflation is caused by ___" (excess demand over supply) and "Hyperinflation refers to ___" (extremely rapid, out-of-control inflation). NECO asks about the Consumer Price Index (CPI) as a measure of inflation: CPI = (cost of basket in current year / cost of basket in base year) × 100. The inflation rate = ((CPI this year - CPI last year) / CPI last year) × 100. Know the relationship between inflation and unemployment (Phillips curve) at a basic level. WAEC has tested this.`,
    commonTrap: `Students often define inflation as "an increase in prices." That's too vague. Inflation is a SUSTAINED increase in the GENERAL price level. A one-time price increase of one product (like yam getting more expensive during planting season) is not inflation — it's a relative price change. Inflation means MOST prices are rising over a CONTINUOUS period. Another trap: confusing causes with effects. Rising prices is an EFFECT of inflation, not a cause. The causes are demand-pull or cost-push factors. Also, students sometimes say "inflation is always bad." Mild inflation (2-4%) is actually considered healthy for an economy — it encourages spending and investment. It's hyperinflation (extremely high, above 50% per month) and deflation (falling prices, which can be even more damaging) that are the real problems.`,
    questions: [
      'Distinguish between demand-pull inflation and cost-push inflation. Give two examples of factors that could cause each in Nigeria.',
      'Explain four effects of inflation on the economy. In your answer, distinguish between effects on consumers, producers, and the government.',
      'The Central Bank of Nigeria raises interest rates to combat inflation. Explain how this measure is expected to reduce the rate of inflation.'
    ]
  },

  'fiscal-policy-and-government-spending': {
    title: "Fiscal Policy — What the Government Does With Your Tax Money",
    breakdown: `Fiscal policy is the government's use of taxation and spending to influence the economy. It's one of the two main tools governments have (the other being monetary policy, which is controlled by the central bank). The government collects revenue mainly through taxes, and spends it on things like infrastructure, education, healthcare, defense, and salaries.

There are two directions fiscal policy can go. Expansionary fiscal policy: the government INCREASES spending and/or DECREASES taxes to stimulate the economy. More government spending means more jobs, more income, more consumption. Lower taxes mean people keep more of their money and spend more. This is used during recessions to boost economic activity. Contractionary fiscal policy: the government DECREASES spending and/or INCREASES taxes to cool down an overheating economy. This reduces aggregate demand and helps control inflation. The government budget can be in one of three states: surplus (revenue > spending), balanced (revenue = spending), or deficit (spending > revenue). When the government runs a deficit, it borrows money — creating public/national debt. Types of taxes: direct taxes (income tax, company tax — paid directly by the person or business) and indirect taxes (VAT, customs duties — included in the price of goods). Progressive taxes take a higher percentage from higher earners. Regressive taxes take a higher percentage from lower earners.`,
    examRelevance: `WAEC tests fiscal policy as an essay question regularly. You'll be asked to explain fiscal policy tools, distinguish between expansionary and contractionary fiscal policy, or discuss the types and effects of taxation. JAMB asks: "Fiscal policy involves the use of ___" (government spending and taxation). "A budget deficit occurs when ___" (government spending exceeds revenue). NECO tests the types of taxes and their effects on income distribution. WAEC also asks about the merits and demerits of direct vs indirect taxation. Direct taxes are progressive and based on ability to pay but are hard to collect and easy to evade. Indirect taxes are easy to collect and hard to evade but are regressive (they affect the poor more since they spend a larger proportion of their income on goods). Know the Nigerian budget process and the role of the National Assembly in approving the budget.`,
    commonTrap: `Students often confuse fiscal policy with monetary policy. Fiscal policy = government spending and taxation (controlled by the government/legislature). Monetary policy = interest rates and money supply (controlled by the central bank). They work toward similar goals but use different tools. Another trap: saying "the government should reduce taxes AND increase spending to reduce inflation." That's the OPPOSITE of what contractionary fiscal policy does. To fight inflation, the government should INCREASE taxes and/or REDUCE spending. To fight recession/unemployment, DECREASE taxes and/or INCREASE spending. Getting the direction wrong invalidates your entire answer. Also, students forget that fiscal policy has time lags — it takes months or years for changes in taxation or spending to fully affect the economy. This is an important limitation that WAEC expects you to mention.`,
    questions: [
      'Explain how the government would use fiscal policy to (i) reduce unemployment during a recession and (ii) control inflation during an economic boom.',
      'Distinguish between direct and indirect taxation. Give two examples of each and explain which type is more equitable and why.',
      'A country is running a persistent budget deficit. Discuss two consequences of this deficit and two measures the government could take to address it.'
    ]
  },

  'types-of-market-structures-in-economics': {
    title: "Market Structures — From Perfect Competition to Monopoly (And Everything Between)",
    breakdown: `A market structure describes how a market is organized — how many firms there are, how similar their products are, and how easy it is to enter or exit the market. There are four main types, and they exist on a spectrum from most competitive to least competitive.

Perfect Competition: Many small firms, identical products, perfect information, free entry and exit. No single firm can influence the price — they're all "price takers." This is the theoretical ideal; real-world examples are rare (closest might be agricultural markets where many small farmers sell identical produce). Monopolistic Competition: Many firms, slightly differentiated products (brands, packaging, quality), relatively easy entry and exit. Think of restaurants — many of them, each slightly different. Firms have a tiny bit of price-setting power because of product differentiation. Oligopoly: Few large firms dominate the market. Products may be similar (petrol) or differentiated (cars). High barriers to entry (cost, technology, regulations). Firms are interdependent — each firm's decisions affect the others. This often leads to price rigidity, collusion, or price wars. Nigerian examples: telecommunications (MTN, Glo, Airtel, 9mobile), banking, cement. Monopoly: One firm controls the entire market. No close substitutes. Very high barriers to entry. The monopolist is a price maker. Examples: NEPA/PHCN (when it was the sole electricity provider), water corporations in many states.`,
    examRelevance: `Market structures are a WAEC essay favorite. The comparison table is practically guaranteed: you'll need to compare all four structures across multiple criteria (number of firms, type of product, barriers to entry, price determination, examples). JAMB asks identification questions: "A market with many sellers and differentiated products is ___" (monopolistic competition). "Interdependence of firms is a feature of ___" (oligopoly). WAEC also asks about the advantages and disadvantages of monopoly — monopolies can achieve economies of scale and fund R&D, but they can also exploit consumers with high prices and produce less output. NECO tests why governments regulate monopolies (to prevent exploitation, ensure fair pricing, protect consumers). Know the Nigerian Competition Law and the role of agencies like FCCPC (Federal Competition and Consumer Protection Commission).`,
    commonTrap: `The most common mistake: confusing monopolistic competition with monopoly just because the word "monopol" is in both. They're very different. Monopolistic competition has MANY firms — the "monopolistic" part just means each firm has a tiny monopoly over its differentiated product. Monopoly means ONE firm. Another trap: saying perfect competition exists widely in the real world. It's largely a theoretical model used for comparison. Most real markets are monopolistic competition or oligopoly. Also, students often forget that oligopoly is characterized by INTERDEPENDENCE — each firm considers how its rivals will react before making decisions. This is unique to oligopoly and doesn't apply to the other structures. And when giving Nigerian examples, make sure they're accurate — WAEC markers know the Nigerian market. Don't claim there's perfect competition in the Nigerian telecoms market when it's clearly an oligopoly.`,
    questions: [
      'Draw a comparison table for the four market structures, covering: number of firms, type of product, entry conditions, price determination, and one Nigerian example for each.',
      'Explain why firms in an oligopoly tend to maintain stable prices, even when costs change. What is meant by "price rigidity" or the "kinked demand curve"?',
      'Discuss three advantages and three disadvantages of monopoly for consumers and the economy. Should the government break up all monopolies? Justify your answer.'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  GOVERNMENT (6)
  // ═══════════════════════════════════════════════════════════════════════════

  'separation-of-powers-in-government': {
    title: "Separation of Powers — Why One Branch Can't Do Everything",
    breakdown: `Separation of powers is the division of government responsibilities into three distinct branches — the Legislature, the Executive, and the Judiciary — to prevent any single person or group from having too much power. It was championed by the French philosopher Montesquieu, and it's a cornerstone of modern democratic government.

The Legislature makes the laws. In Nigeria, this is the National Assembly (Senate and House of Representatives at the federal level, and State Houses of Assembly at the state level). The Executive implements and enforces the laws. In Nigeria, the President heads the executive at the federal level, and Governors at the state level. The executive includes all government ministries, departments, and agencies. The Judiciary interprets the laws and settles disputes. In Nigeria, the Supreme Court is the highest court, followed by the Court of Appeal, Federal High Courts, and State High Courts. Checks and balances ensure that each branch can limit the powers of the others. The legislature checks the executive through budget approval, oversight, and the power to impeach. The executive checks the legislature through veto power. The judiciary checks both through judicial review — the power to declare laws or executive actions unconstitutional. The whole system is designed so that power is never concentrated. As Lord Acton said: "Power tends to corrupt, and absolute power corrupts absolutely."`,
    examRelevance: `Separation of powers is tested in WAEC, JAMB, and NECO every year. It's one of the most predictable topics in government. WAEC essay: "Explain the doctrine of separation of powers. State five merits and three demerits." JAMB: "The doctrine of separation of powers was propounded by ___" (Montesquieu). "Which arm of government is responsible for interpreting laws?" (Judiciary). NECO tests how checks and balances work in practice — "Explain how the legislature checks the executive in Nigeria." Know the specific Nigerian context: the National Assembly approves the budget, confirms ministerial appointments, and can impeach the President. The President can veto bills but the National Assembly can override the veto with a two-thirds majority. The Supreme Court can invalidate laws that violate the Constitution. Also know the limitations of separation of powers in practice — executive dominance, legislative rubber-stamping, and political interference with the judiciary are real issues in Nigeria.`,
    commonTrap: `Students often describe separation of powers as meaning the three branches have NO interaction at all. That's too extreme. Checks and balances specifically require the branches to interact and limit each other. Complete separation with no overlap would make government unworkable. Another trap: confusing separation of powers with rule of law. They're related but distinct concepts. Separation of powers is about DIVIDING government functions. Rule of law is about EVERYONE (including the government) being subject to the law. Also, students sometimes say the judiciary "makes laws." The judiciary interprets laws and applies them to specific cases. When courts set precedents, those have the force of law (common law), but the judiciary's primary role is interpretation, not legislation. WAEC specifically tests this distinction.`,
    questions: [
      'Define separation of powers and state the three arms of government. For each arm, explain its primary function and give one specific example of how it operates in Nigeria.',
      'Explain the system of checks and balances. Give three specific examples of how one arm of government checks another in Nigeria\'s political system.',
      'Discuss four merits and three limitations of the doctrine of separation of powers in practice.'
    ]
  },

  'federalism-in-nigeria-explained': {
    title: "Federalism — How Nigeria Shares Power Between Abuja and the 36 States",
    breakdown: `Federalism is a system of government where political power is shared between a central (federal) government and regional (state or local) governments. Each level of government has its own area of authority defined by the constitution. Nigeria operates a federal system with three tiers: the Federal Government (Abuja), 36 State Governments, and 774 Local Government Areas.

The Nigerian Constitution divides powers into three lists. The Exclusive List contains matters only the Federal Government can handle — defense, foreign affairs, currency, immigration, customs, and trunk roads. The Concurrent List contains matters both federal and state governments can legislate on — education, health, agriculture, and housing. If federal and state laws conflict on a concurrent matter, the federal law prevails (doctrine of covering the field). The Residual List contains matters not explicitly assigned to any list — these fall to the state governments. Revenue allocation is a critical and often contentious aspect of Nigerian federalism. The Federation Account receives most national revenue (especially oil revenue), which is then distributed among the three tiers using a formula that considers factors like population, equality of states, internal revenue generation, land mass, and the derivation principle (oil-producing states get at least 13% of revenue from resources in their territory). The reasons for adopting federalism in Nigeria include the country's ethnic and cultural diversity (over 250 ethnic groups), the large geographical size, the need to bring government closer to the people, and historical factors from the colonial amalgamation of 1914.`,
    examRelevance: `Federalism is one of the most-tested topics in WAEC Government. Essay questions include: "Explain the features of a federal system of government" and "Discuss the problems of federalism in Nigeria." JAMB asks: "In a federal state, the power to make laws on defense rests with ___" (the federal government — it's on the exclusive list). "The residual legislative list in Nigeria is for ___" (state governments). NECO tests the reasons for and against federalism: advantages include accommodating diversity, preventing tyranny, and allowing experimentation with policies at state level. Problems include revenue allocation disputes, ethnic rivalries, boundary conflicts, and the dominance of the federal government over states (Nigeria's "feeding bottle federalism" — states depend heavily on federal allocation). Know the 1999 Constitution's provisions on federalism, including the legislative lists in the Second Schedule and the revenue allocation formula.`,
    commonTrap: `Students often describe Nigeria's federalism as "balanced" between the three tiers. In practice, the federal government is significantly more powerful than states and local governments — it controls the military, police, major revenue sources (oil, customs), and can declare a state of emergency. This is sometimes called "unitary federalism" and is a valid criticism. Another trap: confusing federalism with confederation. In a federation, the central government has direct authority over citizens. In a confederation, the central body has authority only over the component states, not individuals. Nigeria is a federation, not a confederation. Also, students sometimes list "local government" as having its own legislative list. It doesn't — local governments derive their powers from the state government and the constitution, not from a separate residual list. The residual list is for STATE governments.`,
    questions: [
      'State five features of a federal system of government and explain why Nigeria adopted federalism. Give at least three specific reasons.',
      'Explain the differences between the exclusive, concurrent, and residual legislative lists in Nigeria. Give two examples of items on each list.',
      'Discuss four problems of federalism in Nigeria. For each problem, suggest a possible solution.'
    ]
  },

  'fundamental-human-rights-in-nigeria': {
    title: "Human Rights — The Rights You Have (And the Ones Nigeria Still Struggles With)",
    breakdown: `Human rights are the basic rights and freedoms that every person is entitled to simply because they are human. They're considered universal, inalienable (they can't be taken away), and indivisible (they're all equally important). The Universal Declaration of Human Rights (UDHR) was adopted by the United Nations in 1948 — it outlines 30 fundamental rights including the right to life, freedom from torture, freedom of expression, right to education, and right to work.

In Nigeria, fundamental human rights are enshrined in Chapter IV of the 1999 Constitution (Sections 33-46). These include: Right to Life (Section 33) — no one shall be deprived of life intentionally, except in certain legally prescribed circumstances. Right to Dignity (Section 34) — freedom from torture, inhuman treatment, slavery, and forced labor. Right to Personal Liberty (Section 35) — freedom from arbitrary arrest and detention. Right to Fair Hearing (Section 36) — everyone is entitled to a fair trial. Right to Private and Family Life (Section 37). Right to Freedom of Thought, Conscience, and Religion (Section 38). Right to Freedom of Expression and the Press (Section 39). Right to Peaceful Assembly and Association (Section 40). Right to Freedom of Movement (Section 41). Right to Freedom from Discrimination (Section 42). However, these rights are NOT absolute. Section 45 allows the government to limit them for defense, public safety, public order, public morality, or public health. This is the "derogation clause" — and it's frequently tested.`,
    examRelevance: `Human rights appear in WAEC, JAMB, NECO, and GCE. WAEC essay: "State six fundamental human rights as contained in Chapter IV of the 1999 Nigerian Constitution and explain the limitations on these rights." JAMB: "The right to personal liberty is contained in which section of the Nigerian Constitution?" (Section 35). "Under what circumstances can fundamental human rights be limited?" (during war, national emergency, or as outlined in Section 45). NECO tests the difference between fundamental human rights (civil/political rights — legally enforceable) and directive principles of state policy under Chapter II (socio-economic rights like right to health, education, environment — these are NOT legally enforceable in Nigeria). This distinction is heavily tested. Also know the role of the courts in enforcing human rights — any person whose rights are violated can apply to the High Court for redress. Know at least one landmark human rights case in Nigeria.`,
    commonTrap: `The biggest mistake: saying human rights are "absolute" and "cannot be limited under any circumstances." Chapter IV rights CAN be limited — Section 45 of the 1999 Constitution allows derogation in the interest of defense, public safety, public order, public morality, or public health. Students who say rights are absolute contradict the Constitution and lose marks. Another trap: confusing fundamental human rights (Chapter IV — enforceable in court) with fundamental objectives and directive principles (Chapter II — not enforceable in court). Right to education is in Chapter II, not Chapter IV. Similarly, the right to health and the right to an adequate standard of living are directive principles, not fundamental rights, under the Nigerian Constitution. Also, students sometimes list rights from the UDHR that aren't in Chapter IV of the Nigerian Constitution — stick to the Constitution's specific sections when the question asks about Nigeria.`,
    questions: [
      'List six fundamental human rights guaranteed by Chapter IV of the 1999 Nigerian Constitution. For each, state the section number and briefly explain what it protects.',
      'Explain the circumstances under which fundamental human rights can be limited in Nigeria. Refer to the relevant constitutional provision.',
      'Distinguish between fundamental human rights (Chapter IV) and directive principles of state policy (Chapter II) of the 1999 Constitution. Why are directive principles not enforceable in court?'
    ]
  },

  'electoral-systems-and-voting-methods': {
    title: "Electoral Systems — How Votes Turn Into Winners (It's Not Always Fair)",
    breakdown: `An electoral system is the set of rules that determine how elections are conducted and how votes are translated into seats or positions. The system a country uses can dramatically affect the outcome — the same votes can produce different winners depending on the rules.

First Past the Post (FPTP): The simplest system. Whoever gets the most votes wins — no need for a majority (over 50%). Nigeria uses a modified form of FPTP for legislative elections (National Assembly and State Houses of Assembly). It's simple to understand and produces clear winners, but it can be unfair to smaller parties. A candidate can win with just 30% of the vote if the other 70% is split among several opponents. Proportional Representation (PR): Seats are allocated based on the percentage of votes each party receives. If a party gets 30% of the vote, they get roughly 30% of the seats. More representative, but can lead to coalition governments and instability. There are different variants — party list PR, single transferable vote (STV), etc. Nigeria's presidential election uses a unique system: a candidate must win the most votes AND get at least 25% of votes in at least two-thirds of the 36 states (and FCT). This geographic spread requirement is designed to prevent regional candidates and ensure the President has national support. INEC (Independent National Electoral Commission) is the body responsible for conducting elections in Nigeria. Know its functions — voter registration, delimitation of constituencies, conducting elections, and declaring results.`,
    examRelevance: `Electoral systems are regularly tested in WAEC Government. Essay questions include: "Compare first-past-the-post and proportional representation systems" and "Explain the electoral process in Nigeria." JAMB asks: "In a first-past-the-post system, the winner is determined by ___" (simple plurality — most votes, not necessarily majority). "The body responsible for conducting elections in Nigeria is ___" (INEC). NECO tests the merits and demerits of each system. Know that FPTP tends to produce two-party systems (Duverger's Law), while PR tends to produce multi-party systems. WAEC also asks about the requirements for winning presidential elections in Nigeria — the 25% geographic spread requirement is frequently tested. Know the history of elections in Nigeria, including significant election years (1959, 1979, 1993, 1999, 2015) and their outcomes.`,
    commonTrap: `Students often confuse "majority" with "plurality." FPTP requires a plurality (more votes than any other candidate) not a majority (over 50% of all votes). In FPTP, you can win with 25% if the other candidates split the remaining 75%. Another trap: saying Nigeria uses "pure FPTP." Nigeria's presidential system is NOT pure FPTP because of the geographic spread requirement (25% in 2/3 of states). Legislative elections are closer to FPTP but with some unique features. Also, students sometimes describe INEC as being "under the control of the President." While the President appoints the INEC Chairman, INEC is constitutionally independent. Its independence (or lack thereof in practice) is a valid discussion point, but don't state that it's formally controlled by the executive — that contradicts the Constitution. And don't confuse electoral system with electoral process — the system is the rules for converting votes to seats, the process includes registration, campaigns, voting, counting, and declaration.`,
    questions: [
      'Compare and contrast the first-past-the-post system with proportional representation. State three advantages and three disadvantages of each.',
      'Explain the requirements for winning a presidential election in Nigeria. Why does the Constitution require a geographic spread of votes?',
      'What is the role of INEC in Nigeria\'s electoral process? State four specific functions of INEC and discuss one major challenge it faces.'
    ]
  },

  'features-of-the-nigerian-constitution': {
    title: "The Nigerian Constitution — From 1960 to 1999 (A Quick History)",
    breakdown: `A constitution is the fundamental law of a country — it establishes the structure of government, defines the powers of different branches, and protects the rights of citizens. Nigeria has had several constitutions: the Independence Constitution (1960), the Republican Constitution (1963), the 1979 Constitution, and the current 1999 Constitution (as amended).

The 1960 Constitution established Nigeria as a parliamentary democracy with the Queen of England as head of state (represented by a Governor-General). The Prime Minister was the head of government. Nigeria was a federation of three regions (North, West, East). The 1963 Constitution made Nigeria a republic — replacing the Queen with a ceremonial President as head of state. The Prime Minister remained head of government. Still parliamentary. The 1979 Constitution (after military rule) introduced the American-style presidential system. The President became both head of state AND head of government. It established a bicameral legislature (Senate and House of Representatives) and an independent judiciary. The 1999 Constitution (current) is largely based on the 1979 version. Key features: it is written and supreme (any law inconsistent with it is void), it establishes a presidential system, it provides for a federal structure with 36 states and FCT, it has a rigid amendment procedure (requiring 2/3 of the National Assembly and approval by 2/3 of state Houses of Assembly), it enshrines fundamental human rights in Chapter IV, and it provides for separation of powers and checks and balances.`,
    examRelevance: `Constitutional development is one of the most heavily tested WAEC topics. You'll be asked to compare different constitutions, explain their key features, and discuss their strengths and weaknesses. WAEC essay: "Trace the constitutional development of Nigeria from 1960 to 1999" or "State and explain six features of the 1999 Constitution." JAMB: "Nigeria became a republic in ___" (1963). "Under the 1960 Constitution, the head of government was the ___" (Prime Minister). "The 1999 Nigerian Constitution is ___" (written, supreme, and rigid). NECO tests the differences between parliamentary (1960, 1963) and presidential (1979, 1999) systems. Know why Nigeria switched from parliamentary to presidential — the failure of the First Republic was partly blamed on the instability of the parliamentary system, and the presidential system was seen as providing more stability. Also know the criticism of the 1999 Constitution — that it was drafted by the military without adequate public input.`,
    commonTrap: `The most common mistake: saying Nigeria "gained independence" with the 1963 Constitution. No — Nigeria gained independence on October 1, 1960, with the 1960 Constitution. The 1963 Constitution made Nigeria a REPUBLIC (removed the Queen as head of state), which is different from gaining independence. Another trap: saying the 1979 Constitution established "parliamentary democracy." It established the PRESIDENTIAL system — that's the whole point of the change. Also, students sometimes list the 1989 (Babangida's unimplemented constitution) or the 1995 (Abacha's unimplemented constitution) as major constitutions. These were never fully implemented, so stick to 1960, 1963, 1979, and 1999 unless the question specifically asks about them. And remember: the 1999 Constitution is described as "supreme" because any law that contradicts it is automatically void (Section 1(3)). This means it overrides all other laws, including state laws.`,
    questions: [
      'Compare the 1960 and 1963 Nigerian Constitutions. What was the major change and why was it significant?',
      'State and explain six features of the 1999 Constitution of Nigeria.',
      'Explain why Nigeria transitioned from a parliamentary system to a presidential system in 1979. What problems of the First Republic did the presidential system aim to address?'
    ]
  },

  'pressure-groups-and-their-functions': {
    title: "Pressure Groups — How Regular People Influence Government (Without Running for Office)",
    breakdown: `A pressure group is an organized group of people who share common interests and try to influence government policy without directly seeking political office. Unlike political parties, pressure groups don't want to form the government — they want to influence it from the outside. They're also called interest groups, lobby groups, or advocacy groups.

There are different types. Interest/sectional groups represent the specific interests of their members. Examples: Nigeria Bar Association (NBA — lawyers), Nigerian Medical Association (NMA — doctors), Nigeria Labour Congress (NLC — workers), Academic Staff Union of Universities (ASUU — lecturers). These groups primarily fight for better conditions for their members. Cause/promotional groups fight for a broader cause that benefits society, not just their members. Examples: Amnesty International (human rights), Environmental Rights Action (environmental protection), Civil Liberties Organisation (CLO — civil rights in Nigeria). Methods pressure groups use: lobbying (meeting with government officials to present their case), petitions and letter-writing campaigns, demonstrations and protests (ASUU strikes, NLC protests against fuel price hikes), media campaigns, litigation (taking the government to court), and sometimes civil disobedience. Functions of pressure groups include: providing a channel for citizens to participate in government between elections, educating the public on important issues, checking government excess, representing minority interests that political parties may ignore, and providing expert knowledge to lawmakers.`,
    examRelevance: `WAEC tests pressure groups frequently. Essay questions: "Define pressure groups and distinguish between interest groups and promotional groups" or "State six functions of pressure groups in a democracy." JAMB: "An example of a pressure group in Nigeria is ___" (NLC, NBA, ASUU, NMA). "Pressure groups differ from political parties because ___" (they don't seek to control government directly). NECO asks about the methods used by pressure groups and their effectiveness. The comparison between pressure groups and political parties is a WAEC favorite: pressure groups don't contest elections, don't form government, focus on specific issues, and represent sectional interests. Political parties contest elections, aim to form government, have broad platforms, and seek to appeal to the entire population. Know specific Nigerian examples — ASUU's frequent strikes over university funding, NLC's protests against fuel subsidy removal, and the NBA's advocacy for judicial independence.`,
    commonTrap: `The biggest mistake: saying pressure groups "take part in elections" or "seek to form government." That's political parties, not pressure groups. Pressure groups influence government policy WITHOUT seeking to take power themselves. If a pressure group starts running candidates for election, it's becoming a political party. Another trap: confusing specific Nigerian pressure groups. ASUU is for university lecturers (Academic Staff Union of Universities), not all teachers. NUT is the Nigeria Union of Teachers (primary and secondary school teachers). NLC is the Nigeria Labour Congress (umbrella body for trade unions). Getting these wrong shows the examiner you don't know your examples. Also, students sometimes say pressure groups are "undemocratic" because they're not elected. But pressure groups enhance democracy by giving citizens a voice between elections and representing interests that the government might otherwise ignore. Their methods (peaceful protest, lobbying, litigation) are democratic tools.`,
    questions: [
      'Define pressure groups and distinguish between interest groups and promotional groups. Give two Nigerian examples of each type.',
      'In what five ways do pressure groups differ from political parties? Present your answer in a comparison table.',
      'Assess the role of pressure groups in the Nigerian democratic process. State four positive contributions and two potential negative effects of pressure group activities.'
    ]
  }
};

// ─── Page Generation ─────────────────────────────────────────────────────────

function generatePage(keyword, template) {
  const now = new Date().toISOString();
  const slug = keyword.slug;
  const subject = keyword.subject;
  const concept = template.title;
  const targetKeywords = keyword.related_concepts || [];
  const examRelevance = (keyword.nigerian_exam_relevance || []).join(', ');

  const metaDescription = keyword.keyword
    ? `${keyword.keyword} explained simply for Nigerian students. Covers ${subject} concepts for ${examRelevance}. Active recall questions included.`
    : `${concept} explained simply. Study guide for ${examRelevance}.`;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: template.title,
    description: metaDescription,
    educationalLevel: keyword.difficulty || 'intermediate',
    about: {
      '@type': 'Thing',
      name: keyword.keyword || concept
    },
    provider: {
      '@type': 'Organization',
      name: 'The Professor AI',
      url: 'https://theprofessor.app'
    },
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Course',
      name: `${subject} Study Guide`,
      provider: {
        '@type': 'Organization',
        name: 'The Professor AI'
      }
    }
  };

  // Build the page
  const lines = [];

  // YAML frontmatter
  lines.push('---');
  lines.push(`title: "${template.title.replace(/"/g, '\\"')}"`);
  lines.push(`meta_description: "${metaDescription.replace(/"/g, '\\"')}"`);
  lines.push(`subject: "${subject}"`);
  lines.push(`keywords:`);
  targetKeywords.forEach(kw => {
    lines.push(`  - "${kw}"`);
  });
  if (keyword.keyword) {
    lines.push(`  - "${keyword.keyword}"`);
  }
  lines.push(`slug: "${slug}"`);
  lines.push(`difficulty: "${keyword.difficulty || 'intermediate'}"`);
  lines.push(`exam_relevance:`);
  (keyword.nigerian_exam_relevance || []).forEach(exam => {
    lines.push(`  - "${exam}"`);
  });
  lines.push(`generated_at: "${now}"`);
  lines.push('---');
  lines.push('');

  // Title
  lines.push(`# ${template.title}`);
  lines.push('');

  // 60-Second Breakdown
  lines.push('## The 60-Second Breakdown');
  lines.push('');
  lines.push(template.breakdown.trim());
  lines.push('');

  // Exam Relevance
  lines.push('## Why This Shows Up on Your Exam');
  lines.push('');
  lines.push(template.examRelevance.trim());
  lines.push('');

  // Common Trap
  lines.push('## The Common Trap');
  lines.push('');
  lines.push(template.commonTrap.trim());
  lines.push('');

  // Test Yourself
  lines.push('## Test Yourself');
  lines.push('');
  lines.push("Don't just read — test yourself. Cover the sections above and try to answer these from memory:");
  lines.push('');
  template.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q}`);
    lines.push('');
  });

  // Go Deeper CTA
  lines.push('## Go Deeper');
  lines.push('');
  lines.push(`Upload your ${subject} notes to The Professor and we'll turn them into a full exam simulation — with oral questions, marking, and feedback. Free. Takes 30 seconds.`);
  lines.push('');
  lines.push('[Try it now →](https://theprofessor.app)');
  lines.push('');

  // JSON-LD
  lines.push('<!-- JSON-LD Structured Data -->');
  lines.push('<script type="application/ld+json">');
  lines.push(JSON.stringify(jsonLd, null, 2));
  lines.push('</script>');
  lines.push('');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('');
  console.log('📚 The Professor — SEO Page Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // 1. Read keyword map
  if (!fs.existsSync(KEYWORD_MAP_PATH)) {
    console.error('❌ keyword-map.json not found at:', KEYWORD_MAP_PATH);
    console.error('   Run this script from the project root.');
    process.exit(1);
  }

  let keywords;
  try {
    const raw = fs.readFileSync(KEYWORD_MAP_PATH, 'utf-8');
    keywords = JSON.parse(raw);
    // Handle both array format and {meta, keywords} format
    if (!Array.isArray(keywords) && keywords.keywords) {
      keywords = keywords.keywords;
    }
  } catch (err) {
    console.error('❌ Failed to parse keyword-map.json:', err.message);
    process.exit(1);
  }

  console.log(`📖 Loaded ${keywords.length} keywords from keyword-map.json`);
  console.log('');

  // 2. Filter keywords
  let filtered = keywords;

  if (filterSubject) {
    filtered = filtered.filter(k => k.subject.toLowerCase() === filterSubject.toLowerCase());
    if (filtered.length === 0) {
      console.error(`❌ No keywords found for subject "${filterSubject}"`);
      console.error('   Available subjects:', [...new Set(keywords.map(k => k.subject))].join(', '));
      process.exit(1);
    }
    console.log(`🔍 Filtering by subject: ${filterSubject} (${filtered.length} keywords)`);
  }

  if (filterSlug) {
    filtered = filtered.filter(k => k.slug === filterSlug);
    if (filtered.length === 0) {
      console.error(`❌ No keyword found with slug "${filterSlug}"`);
      process.exit(1);
    }
    console.log(`🔍 Filtering by slug: ${filterSlug}`);
  }

  // 3. Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  // 4. Generate pages
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const subjects = {};

  for (const keyword of filtered) {
    const template = CONTENT_TEMPLATES[keyword.slug];

    if (!template) {
      console.log(`⚠️  No content template for slug: ${keyword.slug} — skipping`);
      skipped++;
      continue;
    }

    try {
      const content = generatePage(keyword, template);
      const outputPath = path.join(OUTPUT_DIR, `${keyword.slug}.md`);
      fs.writeFileSync(outputPath, content, 'utf-8');

      // Track by subject
      if (!subjects[keyword.subject]) subjects[keyword.subject] = 0;
      subjects[keyword.subject]++;

      generated++;
      console.log(`✅ ${keyword.slug}.md (${keyword.subject})`);
    } catch (err) {
      console.error(`❌ Failed to generate ${keyword.slug}: ${err.message}`);
      errors++;
    }
  }

  // 5. Summary
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Generation Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Generated: ${generated} pages`);
  if (skipped > 0) console.log(`   ⚠️  Skipped:   ${skipped} (no content template)`);
  if (errors > 0) console.log(`   ❌ Errors:    ${errors}`);
  console.log('');

  if (Object.keys(subjects).length > 0) {
    console.log('   By subject:');
    for (const [subj, count] of Object.entries(subjects).sort((a, b) => b[1] - a[1])) {
      console.log(`     📗 ${subj}: ${count} pages`);
    }
  }

  console.log('');
  console.log(`   Output: ${OUTPUT_DIR}`);
  console.log('');
  console.log('🎉 Done! Each page is a genuine study guide a student would actually read.');
  console.log('');
}

main();
