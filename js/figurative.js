/*
 * figurative.js — content for the Figurative Language Corner.
 * Each device has a child-friendly definition, how to spot it, how to write
 * your own, why writers use it, and examples. In each example:
 *   t: the example – [[double brackets]] mark the part that shows the device
 *   m: what it means
 *   u: where / when you could use it
 *   tags: writing themes (see THEMES)
 *   x: extra note (the sound for assonance, the sense for imagery)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Figurative = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const THEMES = {
    weather: '⛈️ Weather',
    sea: '🌊 Sea & water',
    nature: '🌲 Nature & animals',
    spooky: '🌙 Night & spooky',
    fear: '😨 Fear & suspense',
    action: '⚡ Action & battles',
    fantasy: '🐉 Fantasy & adventure',
    happy: '😊 Happy',
    sad: '😢 Sad',
    angry: '😠 Angry',
    character: '👤 Describing people',
    home: '🏡 Home & school',
    city: '🏙️ Towns & cities',
    winter: '❄️ Winter',
    summer: '☀️ Summer',
  };

  const DEVICES = [
    {
      id: 'simile', name: 'Simile', emoji: '🪞', colour: '#1970BE', soft: '#E7F5FF',
      short: 'Compares two things using “like” or “as”.',
      what: 'A simile compares one thing to another using the words <strong>like</strong> or <strong>as</strong>. It helps the reader picture something by comparing it to something they already know.',
      spot: 'Look for the words “like” or “as … as” comparing two different things.',
      recipe: ['The ___ was <strong>as</strong> ___ <strong>as</strong> a ___.', 'The ___ moved <strong>like</strong> a ___.'],
      why: 'Similes paint a picture in the reader’s mind. Choose a comparison that matches the mood: a gentle one for a calm scene, a scary one for a tense scene.',
      prompts: ['Write a simile to describe a storm.', 'Write a simile about a very fast animal.', 'Write a simile to describe a spooky house.', 'Write a simile about how a character feels on their birthday.'],
      examples: [
        { t: 'The snow was [[as soft as a feather pillow]].', m: 'The snow was very soft and gentle.', u: 'Describing a calm, peaceful winter scene.', tags: ['winter', 'nature'] },
        { t: 'The waves crashed against the rocks [[like angry giants]].', m: 'The waves were huge and powerful, smashing down with great force.', u: 'A stormy sea, a shipwreck or a dangerous journey by boat.', tags: ['sea', 'weather', 'action'] },
        { t: 'Her eyes sparkled [[like diamonds in the sunlight]].', m: 'Her eyes were bright and full of happiness or excitement.', u: 'Describing a happy or excited character.', tags: ['character', 'happy'] },
        { t: 'The old house creaked [[like the bones of an ancient giant]].', m: 'The house made long groaning sounds and felt old and fragile.', u: 'A haunted house or any spooky, abandoned building.', tags: ['spooky', 'fear'] },
        { t: 'He ran [[as fast as a cheetah chasing its dinner]].', m: 'He ran extremely fast.', u: 'A chase, a race or an escape.', tags: ['action'] },
        { t: 'The classroom was [[as quiet as a library at midnight]].', m: 'The room was completely silent.', u: 'A tense moment, such as waiting for results or when someone is in trouble.', tags: ['home', 'fear'] },
        { t: 'The dragon’s breath was [[as hot as a blazing furnace]].', m: 'The dragon’s breath was so hot that it could burn almost anything.', u: 'A fantasy story with a fierce creature.', tags: ['fantasy', 'action'] },
        { t: 'The fog crept through the streets [[like a grey ghost]].', m: 'The fog moved slowly and silently, making the town feel eerie.', u: 'A mysterious night-time scene in a town or village.', tags: ['spooky', 'city', 'weather'] },
        { t: 'My heart was pounding [[like a drum]].', m: 'My heart was beating fast and hard because of fear or excitement.', u: 'A scary or exciting moment, just before something happens.', tags: ['fear', 'action'] },
        { t: 'The sun hung in the sky [[like a golden coin]].', m: 'The sun was round, bright and shining.', u: 'A sunny summer’s day.', tags: ['summer', 'happy'] },
        { t: 'He was [[as grumpy as a bear woken from its winter sleep]].', m: 'He was very bad-tempered.', u: 'Describing a cross or moody character.', tags: ['angry', 'character'] },
        { t: 'Tears rolled down her cheeks [[like raindrops on a window]].', m: 'She was crying slowly and quietly.', u: 'A sad scene, such as a goodbye.', tags: ['sad'] },
      ],
    },
    {
      id: 'metaphor', name: 'Metaphor', emoji: '🎭', colour: '#7048E8', soft: '#F3F0FF',
      short: 'Says something IS something else.',
      what: 'A metaphor says one thing <strong>is</strong> something else, without using “like” or “as”. It isn’t really true. It’s a powerful way of describing something.',
      spot: 'Look for “is”, “was” or “are” joining two very different things. It can’t be literally true!',
      recipe: ['The ___ <strong>was</strong> a ___.', '___ <strong>is</strong> a ___ that ___.'],
      why: 'Metaphors are stronger than similes because they say something IS the other thing, not just that it is like it.',
      prompts: ['Write a metaphor to describe the moon.', 'Write a metaphor about a noisy classroom.', 'Write a metaphor to describe a scary forest.', 'Write a metaphor about a feeling, like fear or joy.'],
      examples: [
        { t: 'The moon was [[a silver lantern]] guiding them home.', m: 'The moon was bright and gave them enough light to find their way.', u: 'A night-time journey or an adventure in the dark.', tags: ['spooky', 'fantasy'] },
        { t: 'After lunch, the classroom was [[a zoo]].', m: 'The classroom was noisy, wild and out of control.', u: 'A busy, chaotic school or home scene.', tags: ['home'] },
        { t: 'Her words were [[daggers]].', m: 'What she said was sharp and hurtful.', u: 'An argument or when a character is being unkind.', tags: ['angry', 'character'] },
        { t: 'In January, the playground was [[a frozen desert]].', m: 'The playground was icy, empty and bare.', u: 'A cold winter scene.', tags: ['winter', 'home'] },
        { t: 'She is [[a shining star]] on the football pitch.', m: 'She is very talented and stands out from everyone else.', u: 'Describing a character who is brilliant at something.', tags: ['character', 'happy'] },
        { t: 'The forest was [[a maze of shadows]].', m: 'The forest was dark and confusing, and it would be easy to get lost.', u: 'A scary forest or a character who is lost.', tags: ['nature', 'spooky', 'fear'] },
        { t: 'My little brother is [[a whirlwind]].', m: 'My brother is full of energy and leaves a mess wherever he goes.', u: 'Describing a lively, energetic character.', tags: ['character', 'home'] },
        { t: 'The storm was [[a raging beast]], tearing at the trees.', m: 'The storm was wild, dangerous and destructive.', u: 'A dramatic storm scene.', tags: ['weather', 'action'] },
        { t: 'Time was [[a thief]], stealing the last days of summer.', m: 'The summer holiday seemed to go far too quickly.', u: 'The end of a holiday or a happy time.', tags: ['summer', 'sad'] },
        { t: 'The sea was [[a sheet of glass]].', m: 'The sea was completely calm, flat and smooth.', u: 'A peaceful morning by the sea.', tags: ['sea', 'summer'] },
        { t: 'Fear was [[an icy hand]] gripping his chest.', m: 'He was so frightened that he felt cold and could hardly breathe.', u: 'A moment of terror or suspense.', tags: ['fear'] },
        { t: 'At night, the city was [[a jewellery box]] of glittering lights.', m: 'The city looked beautiful and sparkly in the dark.', u: 'Describing a town or city at night.', tags: ['city', 'happy'] },
      ],
    },
    {
      id: 'personification', name: 'Personification', emoji: '🌬️', colour: '#0B7A8D', soft: '#E3FAFC',
      short: 'Gives human actions or feelings to non-human things.',
      what: 'Personification gives <strong>human feelings or actions</strong> to something that isn’t human, like the weather, an object or a place.',
      spot: 'Look for an object, animal or place doing something only a person can really do, such as whispering, smiling, dancing or groaning.',
      recipe: ['The [thing] [human verb] ___.', 'e.g. The wind <strong>whispered</strong> through the trees.'],
      why: 'It brings a setting to life and can make it feel friendly, sad or threatening.',
      prompts: ['Write a sentence where the wind behaves like a person.', 'Make an old door come to life.', 'Make the sun behave like a person.', 'Make a stormy sea behave like a person.'],
      examples: [
        { t: 'The wind [[howled]] through the empty streets.', m: 'The wind made a long, loud, wailing sound.', u: 'A stormy or spooky night in a town.', tags: ['weather', 'spooky', 'city'] },
        { t: 'The old door [[groaned]] as it opened.', m: 'The door made a long, low creaking sound because it was old.', u: 'Entering a haunted house or an abandoned building.', tags: ['spooky', 'fear'] },
        { t: 'The sun [[smiled down]] on the children playing.', m: 'It was a warm, bright and cheerful day.', u: 'A happy summer scene.', tags: ['happy', 'summer'] },
        { t: 'The trees [[whispered secrets]] to each other.', m: 'The leaves rustled softly in the breeze.', u: 'A quiet, mysterious forest.', tags: ['nature', 'spooky'] },
        { t: 'Flames [[danced]] in the fireplace.', m: 'The fire flickered and moved in a lively way.', u: 'A cosy evening at home.', tags: ['home', 'happy', 'winter'] },
        { t: 'Thunder [[grumbled]] in the distance.', m: 'Thunder made a low, rumbling sound far away. A storm was coming.', u: 'Building tension before something goes wrong.', tags: ['weather', 'fear'] },
        { t: 'The waves [[reached out]] to snatch the sandcastle.', m: 'The waves washed up the beach and destroyed the sandcastle.', u: 'A day at the beach.', tags: ['sea', 'summer'] },
        { t: 'My alarm clock [[screamed]] at me to get up.', m: 'The alarm was very loud and annoying.', u: 'A funny start to a story about a school day.', tags: ['home'] },
        { t: 'The stars [[winked]] at us from the night sky.', m: 'The stars twinkled brightly.', u: 'A calm, magical night-time scene.', tags: ['spooky', 'happy', 'fantasy'] },
        { t: 'The hungry fire [[swallowed]] the forest.', m: 'The fire spread quickly and destroyed the trees.', u: 'A dramatic, dangerous scene.', tags: ['action', 'nature', 'fear'] },
        { t: 'The autumn leaves [[waved goodbye]] as they fell.', m: 'The leaves fluttered down from the trees.', u: 'An autumn scene, or a sad goodbye.', tags: ['nature', 'sad'] },
        { t: 'The castle [[stood guard]] over the sleepy village.', m: 'The castle was tall and strong, and seemed to protect the village.', u: 'Setting the scene at the start of a fantasy story.', tags: ['fantasy'] },
      ],
    },
    {
      id: 'alliteration', name: 'Alliteration', emoji: '🔤', colour: '#BE490A', soft: '#FFF4E6',
      short: 'Several nearby words start with the same sound.',
      what: 'Alliteration is when several words close together <strong>start with the same sound</strong>.',
      spot: 'Look at the first letter or sound of words next to each other. Are they the same?',
      recipe: ['Pick a sound, then choose 3–4 words that start with it: adjective + adjective + noun + verb.', 'e.g. <strong>S</strong>ilent <strong>s</strong>nakes <strong>s</strong>lithered…'],
      why: 'It makes writing catchy and fun to read aloud. Sounds create moods: “s” sounds feel sneaky, while “b”, “d” and “g” sounds feel strong and heavy.',
      prompts: ['Write some alliteration about a sneaky animal.', 'Write some alliteration about the weather.', 'Write some alliteration about your favourite food.', 'Write some alliteration about a monster.'],
      examples: [
        { t: '[[S]]ilent [[s]]nakes [[s]]lithered [[s]]lowly through the [[s]]and.', m: 'The snakes moved quietly and smoothly. The “s” sound copies their hiss.', u: 'A tense jungle or desert scene.', tags: ['nature', 'fear'] },
        { t: 'The [[b]]ig [[b]]rown [[b]]ear [[b]]ounded across the [[b]]ridge.', m: 'A large bear ran with big leaps across the bridge.', u: 'An exciting animal encounter.', tags: ['action', 'nature'] },
        { t: '[[W]]ild [[w]]inds [[w]]hipped the [[w]]aves.', m: 'Strong winds made the sea rough.', u: 'A storm at sea.', tags: ['weather', 'sea'] },
        { t: '[[P]]ink [[p]]etals [[p]]irouetted onto the [[p]]avement.', m: 'Blossom petals spun gently down to the ground.', u: 'A pretty spring or summer scene.', tags: ['nature', 'happy'] },
        { t: '[[D]]ark, [[d]]amp [[d]]ungeons.', m: 'Gloomy, wet underground prison cells.', u: 'A castle or fantasy adventure.', tags: ['spooky', 'fantasy'] },
        { t: '[[C]]runchy, [[c]]rispy [[c]]ookies.', m: 'The biscuits were fresh and crunchy.', u: 'Describing food, or a cosy scene at home.', tags: ['home', 'happy'] },
        { t: 'The [[f]]ierce [[f]]ire [[f]]lickered [[f]]uriously.', m: 'The fire burned wildly and dangerously.', u: 'A dramatic or dangerous moment.', tags: ['action', 'fear'] },
        { t: '[[G]]littering [[g]]olden [[g]]ates.', m: 'Shiny gates made of gold.', u: 'A palace, a treasure or a magical place.', tags: ['fantasy'] },
        { t: '[[T]]iny [[t]]oes [[t]]iptoed [[t]]imidly.', m: 'Someone small crept nervously and quietly.', u: 'Sneaking around at night without being caught.', tags: ['fear', 'character'] },
        { t: '[[R]]ushing [[r]]ivers [[r]]oared.', m: 'Fast-flowing rivers made a loud noise.', u: 'A wild, outdoor adventure.', tags: ['nature', 'sea', 'action'] },
        { t: '[[M]]isty [[m]]ountains [[m]]enaced the [[m]]arching army.', m: 'Foggy mountains looked threatening to the soldiers.', u: 'An epic fantasy journey or battle.', tags: ['fantasy', 'spooky'] },
        { t: '[[H]]appy [[h]]olidays [[h]]urried by.', m: 'The fun holiday went too quickly.', u: 'Remembering a lovely holiday.', tags: ['summer', 'happy'] },
      ],
    },
    {
      id: 'onomatopoeia', name: 'Onomatopoeia', emoji: '💥', colour: '#C92A2A', soft: '#FFF5F5',
      short: 'Words that sound like the noise they describe.',
      what: 'Onomatopoeia is a word that <strong>sounds like the noise it describes</strong>, such as <em>buzz</em>, <em>crash</em> or <em>sizzle</em>.',
      spot: 'Say the word aloud. Does it sound like the noise?',
      recipe: ['Start a sentence with a sound and an exclamation mark: <strong>Crash!</strong> The vase hit the floor.', 'Or use it as a verb: The bees <strong>buzzed</strong>…'],
      why: 'It helps the reader HEAR what is happening, which makes a scene feel real and exciting.',
      prompts: ['Write a sentence with onomatopoeia about a storm.', 'Write a sentence with onomatopoeia about something breaking.', 'Write a sentence with onomatopoeia set in a kitchen.', 'Write a sentence with onomatopoeia about an animal.'],
      examples: [
        { t: 'The fire [[crackled]] and [[hissed]] in the hearth.', m: 'The fire made popping and hissing sounds.', u: 'A cosy scene by the fire.', tags: ['home', 'winter'] },
        { t: '[[Splash!]] The stone hit the water.', m: 'The stone landed in the water with a loud splash.', u: 'An exciting moment by a river, lake or sea.', tags: ['sea', 'action'] },
        { t: 'Bees [[buzzed]] lazily around the flowers.', m: 'Bees hummed as they flew slowly around the garden.', u: 'A warm, peaceful summer garden.', tags: ['summer', 'nature'] },
        { t: '[[Crash!]] The vase smashed on the floor.', m: 'The vase broke with a loud noise.', u: 'A sudden accident. It is a great way to start a paragraph!', tags: ['home', 'action', 'fear'] },
        { t: 'The rain [[pitter-pattered]] on the roof.', m: 'Light rain made soft tapping sounds.', u: 'A rainy day indoors.', tags: ['weather', 'home'] },
        { t: 'The thunder went [[BOOM!]]', m: 'The thunder was sudden and very loud.', u: 'A dramatic storm.', tags: ['weather', 'fear'] },
        { t: 'The door [[creaked]] open slowly.', m: 'The door made a long squeaking sound because it was old.', u: 'A spooky scene, just before something scary happens.', tags: ['spooky', 'fear'] },
        { t: 'Twigs [[snapped]] and [[crunched]] under his boots.', m: 'Sticks broke noisily as he walked.', u: 'Walking through a forest, maybe while trying to stay quiet!', tags: ['nature', 'spooky', 'fear'] },
        { t: 'An owl [[hooted]] in the dark wood.', m: 'An owl called out in the night.', u: 'Setting a night-time scene in the woods.', tags: ['spooky', 'nature'] },
        { t: 'Car horns [[honked]] and [[beeped]] in the traffic.', m: 'The road was busy and noisy.', u: 'A busy city scene.', tags: ['city'] },
        { t: 'His sword [[clanged]] against the shield.', m: 'Metal hit metal with a loud ringing sound.', u: 'A battle scene.', tags: ['fantasy', 'action'] },
        { t: '[[Drip… drip… drip…]] went the tap in the silent house.', m: 'Water dripped slowly. It was the only sound, which made the silence creepy.', u: 'Building suspense in a quiet, empty place.', tags: ['spooky', 'fear', 'home'] },
        { t: 'Snow [[crunched]] under our wellies.', m: 'The snow made a crisp sound as we walked.', u: 'A snowy winter walk.', tags: ['winter'] },
      ],
    },
    {
      id: 'hyperbole', name: 'Hyperbole', emoji: '🚀', colour: '#C2255C', soft: '#FFF0F6',
      short: 'A huge exaggeration that isn’t meant literally.',
      what: 'Hyperbole (say it: <em>high-PER-bo-lee</em>) is a <strong>huge exaggeration</strong>. It isn’t meant to be taken literally.',
      spot: 'Ask yourself: could this REALLY be true? If not, it may be hyperbole.',
      recipe: ['Take a feeling (hungry, tired, cold) and exaggerate it hugely: I’m so ___ I could ___!'],
      why: 'It adds humour or shows how strongly a character feels. It works brilliantly in dialogue.',
      prompts: ['Write some hyperbole about being tired.', 'Write some hyperbole about a very tall giant.', 'Write some hyperbole about a long wait.', 'Write some hyperbole about a very cold day.'],
      examples: [
        { t: 'I’m [[so hungry I could eat a horse]]!', m: 'I am very hungry.', u: 'A character speaking, maybe at lunchtime.', tags: ['home', 'character'] },
        { t: 'I’ve told you [[a million times]]!', m: 'I have told you many times, and I’m frustrated.', u: 'An annoyed parent or teacher talking.', tags: ['angry', 'home'] },
        { t: 'This school bag [[weighs a tonne]].', m: 'The bag is very heavy.', u: 'A funny moment on the way to school.', tags: ['home'] },
        { t: 'The queue [[went on for miles]].', m: 'The queue was very long.', u: 'Waiting at a theme park, a shop or an event.', tags: ['city'] },
        { t: 'I [[nearly died of embarrassment]].', m: 'I was very embarrassed.', u: 'A character describing an awkward moment.', tags: ['character', 'home'] },
        { t: 'It was [[the longest day in the history of the universe]].', m: 'The day felt very long and boring.', u: 'A character who is bored or waiting for something.', tags: ['home', 'sad'] },
        { t: 'The giant was [[taller than the clouds]].', m: 'The giant was enormous.', u: 'A fantasy story or fairy tale.', tags: ['fantasy'] },
        { t: 'It was [[so cold that our words froze in the air]].', m: 'It was extremely cold.', u: 'A freezing winter scene, especially a funny one.', tags: ['winter', 'weather'] },
        { t: 'She ran [[faster than the speed of light]].', m: 'She ran extremely fast.', u: 'A chase or a race.', tags: ['action'] },
        { t: 'My heart [[exploded with joy]].', m: 'I felt extremely happy.', u: 'A wonderful surprise or a big win.', tags: ['happy'] },
        { t: 'The noise was [[loud enough to wake the dead]].', m: 'The noise was extremely loud.', u: 'A loud party, a crash or a spooky story.', tags: ['spooky', 'action'] },
        { t: 'My homework [[took forever]].', m: 'My homework took a long time.', u: 'A character complaining, in dialogue.', tags: ['home'] },
      ],
    },
    {
      id: 'idiom', name: 'Idioms', emoji: '🐈', colour: '#237032', soft: '#EBFBEE',
      short: 'Phrases that mean something different from their words.',
      what: 'An idiom is a <strong>phrase whose meaning is different from the meanings of its words</strong>. “Raining cats and dogs” has nothing to do with animals!',
      spot: 'If a phrase doesn’t make sense word by word, it might be an idiom.',
      recipe: ['Idioms are fixed phrases, so you can’t easily invent them. Learn them and use them in the right situation, especially in characters’ speech.'],
      why: 'Idioms make speech sound natural and full of character. Use them in dialogue, but not too many at once!',
      prompts: ['Use “over the moon” in a sentence.', 'Use “a piece of cake” in a sentence.', 'Use “butterflies in my stomach” in a sentence.', 'Use “spill the beans” in a sentence.'],
      examples: [
        { t: 'It’s [[raining cats and dogs]]!', m: 'It is raining very heavily.', u: 'A character talking about the weather.', tags: ['weather'] },
        { t: '[[Break a leg]] in the show tonight!', m: 'Good luck! (It is said to performers before a show.)', u: 'Before a play, concert or competition.', tags: ['home', 'happy'] },
        { t: 'When I won the prize, I was [[over the moon]].', m: 'I was extremely happy.', u: 'A character who is delighted.', tags: ['happy'] },
        { t: 'I had [[butterflies in my stomach]] before the race.', m: 'I felt very nervous.', u: 'Just before a test, a race or a performance.', tags: ['fear', 'home'] },
        { t: 'Grandad is feeling a bit [[under the weather]].', m: 'Grandad feels a little ill.', u: 'A character who is unwell.', tags: ['sad', 'character'] },
        { t: 'Oops! I [[let the cat out of the bag]].', m: 'I accidentally told someone a secret.', u: 'A surprise party story or a secret plan.', tags: ['home', 'character'] },
        { t: 'The spelling test was [[a piece of cake]].', m: 'The test was very easy.', u: 'A confident character talking.', tags: ['home', 'happy'] },
        { t: 'Come on, [[spill the beans]]!', m: 'Tell me the secret!', u: 'Friends talking about a secret or a mystery.', tags: ['character'] },
        { t: 'I’m exhausted. Time to [[hit the hay]].', m: 'It’s time to go to bed.', u: 'The end of a long day.', tags: ['home', 'spooky'] },
        { t: 'We only go to the beach [[once in a blue moon]].', m: 'We go very rarely.', u: 'A character describing something that hardly ever happens.', tags: ['summer'] },
        { t: 'Just before the jump, Sam [[got cold feet]].', m: 'Sam became too nervous to do it.', u: 'A character who loses their courage.', tags: ['fear', 'action'] },
        { t: 'When I heard the scream, [[my blood ran cold]].', m: 'I suddenly felt terrified.', u: 'A horror or suspense story.', tags: ['fear', 'spooky'] },
        { t: 'If Mum sees this mess, we’ll be [[in hot water]]!', m: 'We will be in trouble.', u: 'Characters who have done something naughty.', tags: ['home', 'fear'] },
        { t: '[[Hold your horses]]! Wait for everyone else.', m: 'Slow down and be patient.', u: 'A character who is rushing ahead.', tags: ['action', 'character'] },
      ],
    },
    {
      id: 'pathetic', name: 'Pathetic fallacy', emoji: '🌧️', colour: '#495057', soft: '#F1F3F5',
      short: 'The weather matches how a character feels.',
      what: 'Pathetic fallacy is when <strong>the weather or setting matches the feelings</strong> of a character or the mood of the story. (Here, “pathetic” comes from an old word meaning “feelings”, not “useless”!)',
      spot: 'At an emotional moment, look at the weather or setting. Does it match how someone feels?',
      recipe: ['Sad → rain, grey clouds, drizzle', 'Happy → sunshine, blue skies, birdsong', 'Angry → thunder, lightning, howling wind', 'Scared → fog, darkness, shadows'],
      why: 'It SHOWS the reader how a character feels without TELLING them. That makes the writing more powerful.',
      prompts: ['Show that a character is sad, using the weather.', 'Show that a character is happy, using the weather.', 'Show that something bad is about to happen, using the weather.', 'Show that a character is angry, using the weather.'],
      examples: [
        { t: 'As she waved goodbye, [[grey clouds wept rain onto the platform]].', m: 'The rain and grey sky match how sad she feels.', u: 'A sad goodbye or a moving-away scene.', tags: ['sad', 'weather'] },
        { t: '[[The sun burst through the clouds]] the moment he scored the winning goal.', m: 'The sudden sunshine matches his sudden joy.', u: 'A moment of victory or happiness.', tags: ['happy', 'weather'] },
        { t: '[[Thunder rumbled angrily]] as the two kings faced each other.', m: 'The stormy weather matches the anger between the kings.', u: 'Just before a battle or a big argument.', tags: ['angry', 'fantasy', 'action'] },
        { t: '[[A bitter wind]] bit at their faces as they argued.', m: 'The harsh, cold wind matches the harsh, cold argument.', u: 'An argument outdoors.', tags: ['angry', 'weather', 'winter'] },
        { t: '[[Thick fog swallowed the path]], and Tom felt completely lost.', m: 'The fog matches how confused and unsure Tom feels.', u: 'A character who is lost or doesn’t know what to do.', tags: ['fear', 'spooky', 'weather'] },
        { t: '[[Birds sang and flowers bloomed]] on the first day of the holidays.', m: 'The cheerful nature matches the children’s happiness.', u: 'The start of a holiday or a happy day.', tags: ['happy', 'summer', 'nature'] },
        { t: '[[The sky darkened]] as the stranger stepped into the room.', m: 'The darkness hints that the stranger is dangerous.', u: 'Introducing a villain or a mysterious character.', tags: ['fear', 'spooky'] },
        { t: '[[Icy rain lashed the windows]] while Mia lay awake, worrying.', m: 'The harsh rain matches Mia’s troubled, anxious thoughts.', u: 'A character who can’t sleep because they are worried.', tags: ['fear', 'sad', 'weather', 'home'] },
        { t: '[[The storm died away and the sea grew calm]] just as Sam began to relax.', m: 'The calming weather matches Sam’s calmer feelings.', u: 'A peaceful moment after something stressful.', tags: ['sea', 'happy', 'weather'] },
        { t: '[[Lightning split the sky]] as the villain revealed his plan.', m: 'The dramatic lightning matches the shocking, evil moment.', u: 'A big reveal in an adventure story.', tags: ['fantasy', 'fear', 'action'] },
      ],
    },
    {
      id: 'oxymoron', name: 'Oxymoron', emoji: '☯️', colour: '#5F3DC4', soft: '#F3F0FF',
      short: 'Two opposite words side by side.',
      what: 'An oxymoron puts <strong>two words with opposite meanings</strong> right next to each other.',
      spot: 'Look for two words side by side that seem to cancel each other out, like “deafening silence”.',
      recipe: ['Pick a word, think of its opposite, and see if putting them together describes something surprising: <strong>bitter</strong> + <strong>sweet</strong> = bittersweet.'],
      why: 'Oxymorons make the reader stop and think. They are great for showing mixed feelings or unusual situations.',
      prompts: ['Use the oxymoron “deafening silence” in a sentence.', 'Use the oxymoron “bittersweet” in a sentence.', 'Invent your own oxymoron and use it in a sentence.'],
      examples: [
        { t: 'There was a [[deafening silence]] as the head teacher opened the envelope.', m: 'The room was so silent that it felt intense, almost loud.', u: 'A tense moment when everyone is waiting.', tags: ['fear', 'home'] },
        { t: 'Leaving my old school was a [[bittersweet]] moment.', m: 'It felt happy and sad at the same time.', u: 'An ending that brings mixed feelings.', tags: ['sad', 'happy'] },
        { t: 'Grandpa’s jokes are [[seriously funny]].', m: 'His jokes are very funny.', u: 'Describing a fun character.', tags: ['happy', 'character'] },
        { t: 'Sorry, that’s [[old news]] – everyone knows already.', m: 'That information isn’t new any more.', u: 'Characters chatting or gossiping.', tags: ['home', 'character'] },
        { t: 'The [[living dead]] stumbled out of the graveyard.', m: 'Zombies came out of the graveyard.', u: 'A spooky or Halloween story.', tags: ['spooky', 'fear'] },
        { t: 'Only a [[small crowd]] came to watch the match.', m: 'Just a few people came.', u: 'Describing an event that was quieter than expected.', tags: ['city'] },
        { t: 'The new pizza place is [[awfully good]].', m: 'It is extremely good.', u: 'A character giving a review or an opinion.', tags: ['happy', 'city'] },
        { t: 'Dad looked [[clearly confused]] by the instructions.', m: 'It was obvious that Dad didn’t understand.', u: 'A funny moment with a puzzled character.', tags: ['character', 'home'] },
        { t: 'Her crush on Leo was an [[open secret]].', m: 'It was meant to be a secret, but everyone knew!', u: 'A school or friendship story.', tags: ['home', 'character'] },
        { t: 'The school kitchen at lunchtime was [[organised chaos]].', m: 'It was busy and messy, but everything still got done.', u: 'Describing a busy, hectic place.', tags: ['action', 'home'] },
      ],
    },
    {
      id: 'assonance', name: 'Assonance', emoji: '🎵', colour: '#9C36B5', soft: '#F8F0FC',
      short: 'The same vowel sound repeated in nearby words.',
      what: 'Assonance is when <strong>the same vowel sound</strong> (a, e, i, o, u) is repeated in words that are close together.',
      spot: 'Read it aloud and listen for the same vowel sound in the MIDDLE of several words. It is the sound that matters, not the spelling!',
      recipe: ['Choose a vowel sound (like “ee” or “oo”), then pick words that contain it: sl<strong>ee</strong>p d<strong>ee</strong>p, my sw<strong>ee</strong>t.'],
      why: 'It gives writing rhythm and mood. Long vowel sounds (oo, ay, oh) slow your writing down and can feel calm or gloomy.',
      prompts: ['Write a sentence that repeats the “oo” sound.', 'Write a sentence that repeats the “ee” sound.', 'Write a sentence that repeats the “ay” sound.'],
      examples: [
        { t: 'The r[[ai]]n m[[a]]de the l[[a]]ne a l[[a]]ke.', x: 'the “ay” sound', m: 'Heavy rain flooded the lane. The long “ay” sound slows the sentence down.', u: 'A rainy, gloomy day.', tags: ['weather'] },
        { t: 'The l[[i]]ght of the f[[i]]re sh[[i]]ned br[[igh]]t in the n[[igh]]t.', x: 'the long “i” (eye) sound', m: 'The fire glowed brightly in the dark.', u: 'A campfire or a cosy winter evening.', tags: ['spooky', 'winter', 'home'] },
        { t: 'The m[[oo]]n l[[oo]]med over the gl[[oo]]my r[[oo]]ms.', x: 'the “oo” sound', m: 'The moon hung over the dark rooms. The “oo” sound makes it feel eerie.', u: 'A haunted house at night.', tags: ['spooky', 'fear'] },
        { t: 'Sl[[ee]]p d[[ee]]p, my sw[[ee]]t.', x: 'the “ee” sound', m: 'Sleep well, my dear. It sounds soft, like a lullaby.', u: 'A gentle bedtime scene.', tags: ['home', 'happy'] },
        { t: 'The c[[a]]t s[[a]]t s[[a]]dly on the m[[a]]t.', x: 'the short “a” sound', m: 'The cat sat on the mat looking unhappy.', u: 'A playful sentence or a poem for younger readers.', tags: ['home', 'sad'] },
        { t: 'The [[o]]ld b[[oa]]t r[[o]]lled sl[[o]]wly h[[o]]me.', x: 'the long “oh” sound', m: 'The old boat rocked gently on its way home. The long “oh” sound slows the sentence down.', u: 'A slow, peaceful journey by water.', tags: ['sea', 'nature'] },
        { t: 'Fr[[o]]gs h[[o]]p and fl[[o]]p in the b[[o]]g.', x: 'the short “o” sound', m: 'Frogs jump around in the muddy marsh.', u: 'A fun nature description or a poem.', tags: ['nature', 'happy'] },
        { t: 'The gr[[ee]]n tr[[ee]]s gr[[ee]]ted the br[[ee]]ze.', x: 'the “ee” sound', m: 'The trees moved in the wind, as if saying hello.', u: 'A calm summer’s day in the countryside.', tags: ['nature', 'summer'] },
        { t: 'Sh[[ou]]ts and h[[ow]]ls echoed ar[[ou]]nd the t[[ow]]n.', x: 'the “ow” sound', m: 'Loud cries could be heard all over the town.', u: 'A chaotic or frightening night in a town.', tags: ['action', 'city', 'spooky'] },
        { t: 'The d[[u]]ll dr[[u]]m th[[u]]dded in the m[[u]]d.', x: 'the short “u” sound', m: 'The drum made heavy, gloomy thuds.', u: 'A gloomy or tense scene, such as soldiers marching.', tags: ['action', 'sad'] },
      ],
    },
    {
      id: 'imagery', name: 'Imagery', emoji: '🌈', colour: '#A35F1F', soft: '#FFF9DB',
      short: 'Description that uses the five senses.',
      what: 'Imagery is <strong>descriptive language that appeals to the five senses</strong>: sight 👀, sound 👂, smell 👃, touch ✋ and taste 👅. It helps readers imagine they are really there.',
      spot: 'Ask: which sense does this help me use? Can I see, hear, smell, feel or taste it?',
      recipe: ['Pick a setting, then write one sentence for each sense: What can I see? Hear? Smell? Feel? Taste?'],
      why: 'Imagery puts the reader right inside the scene. Using several senses makes a setting feel real.',
      prompts: ['Describe a beach using at least two senses.', 'Describe a spooky forest using sound and touch.', 'Describe a bakery using smell and taste.', 'Describe a winter morning using sight and touch.'],
      examples: [
        { t: '[[Golden sunlight spilled across the emerald fields]], making every blade of grass glitter.', x: '👀 sight', m: 'Bright sunshine lit up the green fields.', u: 'A beautiful summer’s day in the countryside.', tags: ['summer', 'nature', 'happy'] },
        { t: '[[A distant church bell tolled]], its slow notes drifting over the silent rooftops.', x: '👂 sound', m: 'A bell rang slowly far away while everything else was quiet.', u: 'A quiet, mysterious evening in a town.', tags: ['spooky', 'city'] },
        { t: '[[The warm smell of freshly baked bread]] floated out of the bakery.', x: '👃 smell', m: 'The bakery smelled delicious.', u: 'A cosy town or a welcoming home scene.', tags: ['city', 'happy', 'home'] },
        { t: '[[The icy water stung my fingers]] like a hundred tiny needles.', x: '✋ touch', m: 'The water was so cold that it hurt.', u: 'Swimming in the sea or a winter adventure.', tags: ['winter', 'sea'] },
        { t: '[[The sour lemon made my mouth pucker]] and my eyes water.', x: '👅 taste', m: 'The lemon tasted very sour.', u: 'A funny moment involving food.', tags: ['home', 'summer'] },
        { t: '[[Shadows stretched across the floor like long, bony fingers]].', x: '👀 sight', m: 'Dark shadows spread across the room in a creepy way.', u: 'A haunted house or a scary night.', tags: ['spooky', 'fear'] },
        { t: '[[Sand crunched beneath our toes]] and [[gulls cried overhead]].', x: '✋ touch and 👂 sound', m: 'We could feel the sand and hear the seagulls.', u: 'A day at the beach.', tags: ['sea', 'summer'] },
        { t: '[[The damp, musty air smelled of old books and forgotten secrets]].', x: '👃 smell', m: 'The room smelled old and stuffy, as if no one had been there for years.', u: 'An attic, an old library or an abandoned house.', tags: ['spooky', 'home'] },
        { t: '[[Rough, crumbling stone scraped against her palms]] as she climbed the tower.', x: '✋ touch', m: 'The stone felt rough and old under her hands.', u: 'A climbing scene in a castle adventure.', tags: ['fantasy', 'action'] },
        { t: '[[Neon signs flickered red and blue]] across the wet pavements.', x: '👀 sight', m: 'Bright coloured lights reflected on the rainy streets.', u: 'A city at night.', tags: ['city', 'spooky'] },
        { t: '[[Sweet, sticky honey dripped onto my tongue]].', x: '👅 taste', m: 'The honey tasted sweet and delicious.', u: 'A happy breakfast or a picnic.', tags: ['happy', 'home', 'summer'] },
        { t: '[[Leaves rustled and branches creaked]] as something moved in the darkness.', x: '👂 sound', m: 'Strange noises in the trees suggest someone or something is nearby.', u: 'Building suspense in a forest at night.', tags: ['spooky', 'fear', 'nature'] },
      ],
    },
  ];

  // ------------------------------------------------- helpers for "try it yourself"
  const ONOMATOPOEIA = new Set(('bang boom buzz crash crackle creak crunch drip fizz gurgle hiss honk hoot howl hum ' +
    'meow moo oink pop rattle roar rumble rustle sizzle slam slurp smash snap splash splat squeak squelch swish swoosh ' +
    'thud thump tick tock twang vroom whack whir whirr whizz whoosh woof zap zip zoom clang clatter clink ding dong ' +
    'beep bleep bonk boing burp chirp chomp clap click cluck cough crunch cuckoo flutter growl grunt hiccup jingle ' +
    'knock munch mumble neigh purr quack ring rip scrunch shush slosh sniff snort splosh squawk squish tap thwack tinkle ' +
    'tweet wham whimper whisper yap pitter patter pitter-patter kaboom kerplunk plop plonk ping ' +
    'grr argh achoo ahem shh psst brr').split(/\s+/));
  const SMALL = new Set('a an the and of to in on at by with my his her its our their'.split(' '));

  function words(text) { return (String(text).toLowerCase().match(/[a-z’'-]+/g) || []); }

  /** Simple checks for pupils' own sentences. Returns { ok, message } or null if there is no check. */
  function check(deviceId, text) {
    const w = words(text);
    if (!w.length) return null;
    if (deviceId === 'simile') {
      const like = /\blike\b/i.test(text);
      const asAs = /\bas\b\s+\w+(\s+\w+)?\s+as\b/i.test(text);
      return like || asAs
        ? { ok: true, message: `Brilliant! You used “${asAs ? 'as … as' : 'like'}” to compare two things. That’s a simile!` }
        : { ok: false, message: 'A simile needs “like” or “as … as” to compare two things. Try adding one!' };
    }
    if (deviceId === 'metaphor') {
      if (/\blike\b|\bas\b\s+\w+\s+as\b/i.test(text)) return { ok: false, message: 'Careful! Using “like” or “as” makes it a simile. A metaphor says something IS something else.' };
      return /\b(is|was|are|were|am)\b/i.test(text)
        ? { ok: true, message: 'Great! You said one thing IS another. Check it can’t be literally true. That’s what makes it a metaphor!' }
        : { ok: true, message: 'Nice try! Metaphors often use “is” or “was”, e.g. “The moon was a silver lantern”.' };
    }
    if (deviceId === 'alliteration') {
      const content = w.filter((x) => !SMALL.has(x));
      let best = 1;
      let run = 1;
      for (let i = 1; i < content.length; i++) {
        run = content[i][0] === content[i - 1][0] ? run + 1 : 1;
        best = Math.max(best, run);
      }
      return best >= 3
        ? { ok: true, message: `Super! ${best} words in a row start with the same sound. That’s alliteration!` }
        : best === 2
          ? { ok: true, message: 'Good start! Two words start with the same sound. Can you add a third?' }
          : { ok: false, message: 'Try starting three or more words in a row with the same sound.' };
    }
    if (deviceId === 'onomatopoeia') {
      const forms = (x) => {
        const stem = x.replace(/(ed|ing|es|s)$/, '');
        return [x, stem, stem + 'e', stem.replace(/(.)\1$/, '$1'), x.replace(/s$/, '')];
      };
      const found = w.filter((x) => forms(x).some((f) => ONOMATOPOEIA.has(f)));
      return found.length
        ? { ok: true, message: `Fantastic! “${found[0]}” is onomatopoeia. It sounds like the noise it describes!` }
        : { ok: false, message: 'Can you add a word that sounds like a noise, such as crash, buzz, sizzle or creak?' };
    }
    return null;
  }

  /** "[[a]]b" -> [{text:'a', mark:true}, {text:'b', mark:false}] */
  function parts(t) {
    return String(t).split(/(\[\[.*?\]\])/).filter(Boolean).map((p) => (p.startsWith('[[') ? { text: p.slice(2, -2), mark: true } : { text: p, mark: false }));
  }
  function plain(t) { return String(t).replace(/\[\[|\]\]/g, ''); }

  return { DEVICES, THEMES, check, parts, plain };
});
