export const KEYWORDS = ["generate", "make", "create", "video"];

export const QUALIFIERS = ["profile", "profile picture", "pfp", 'profile pic'];

export const APPLE_DOG_DESCRIPTION =
    "A long nose dachshund appears with blonde hair on his body and face. His ears are brown and he is wearing a blue low cut sweater with an apple in his mouth";

export const TEMPLATES = {
    generationSuccess: (message: string) => `
        # Areas of Expertise
        {{knowledge}}

        # About {{agentName}} (@{{twitterUserName}}):
        {{bio}}
        {{lore}}
        {{topics}}

        {{providers}}

        {{characterPostExamples}}

        {{postDirections}}

        # Task: Generate a concise and confident tweet response in the voice, style, and perspective of {{agentName}} (@{{twitterUserName}}).
        Write a post responding to a video generated with the description: ‘${message}’. The response should be brief, cool, and align with the agent's character. Include the project ticker (e.g., "$apple"). Your response must follow this format:
        ‘here’s your video of {{prompt}}. [Short, confident comment] $apple’

        - Keep the response under 20 words.
        - No emojis, hashtags, or overly descriptive language.
        - Use '$apple' at the end
        - Responses should be sharp, engaging, and reflect the agent’s personality.

        Respond only with the formatted tweet.
    `,
    generationError: `
        # Areas of Expertise
        {{knowledge}}

        # About {{agentName}} (@{{twitterUserName}}):
        {{bio}}
        {{lore}}
        {{topics}}

        {{providers}}

        {{characterPostExamples}}

        {{postDirections}}

        # Task: Generate a short, confident tweet in the voice, style, and perspective of {{agentName}} (@{{twitterUserName}}).
        Write a response for when a video generation fails. Acknowledge the issue briefly and reassure the user that the team is aware. The response should:
        - Be calm, composed, and professional.
        - Avoid emojis, hashtags, or unnecessary fluff.
        - Stay under 15 words.
        - Dont use $apple
        - Reflect the agent’s personality while maintaining focus on reassurance.

        Respond only with the formatted tweet.
    `,
};

export const PROMPTS = [
    {
        title: "The dog with apple in mouth and the x-men. $apple",
        prompt: "Generate a comic book style video of apple dog with the x-men.",
    },
    {
        title: "Apple dog on the moon. $apple",
        prompt: "Generate a video of apple dog walking on the moon in a spacesuit.",
    },
    {
        title: "The legendary apple dog in medieval times. $apple",
        prompt: "Generate a video of apple dog as a knight protecting a medieval castle.",
    },
    {
        title: "Apple dog at a music festival. $apple",
        prompt: "Generate a video of apple dog dancing and enjoying a music festival.",
    },
    {
        title: "Apple dog as a pirate. $apple",
        prompt: "Generate a video of apple dog sailing the seas with a treasure map.",
    },
    {
        title: "Apple dog in ancient ruins. $apple",
        prompt: "Generate a video of apple dog discovering treasures in ancient ruins.",
    },
    {
        title: "Futuristic apple dog in a sci-fi city. $apple",
        prompt: "Generate a video of apple dog in a glowing, futuristic city with hover cars.",
    },
    {
        title: "Apple dog winning gold at the Olympics. $apple",
        prompt: "Generate a video of apple dog standing proud on the podium with a medal.",
    },
    {
        title: "Apple dog’s cozy winter cabin. $apple",
        prompt: "Generate a video of apple dog relaxing by a fireplace in a snowy cabin.",
    },
    {
        title: "Apple dog saving the orchard. $apple",
        prompt: "Generate a video of apple dog protecting an orchard from invaders.",
    },
    {
        title: "Apple dog’s superhero adventure. $apple",
        prompt: "Generate a video of apple dog teaming up with superheroes to save the city.",
    },
    {
        title: "The apple dog treasure hunt. $apple",
        prompt: "Generate a video of apple dog searching for hidden treasure in a jungle.",
    },
    {
        title: "Apple dog’s beach day. $apple",
        prompt: "Generate a video of apple dog playing in the sand and surfing the waves.",
    },
    {
        title: "Apple dog in a magical forest. $apple",
        prompt: "Generate a video of apple dog exploring a forest filled with glowing apples.",
    },
    {
        title: "Apple dog in outer space. $apple",
        prompt: "Generate a video of apple dog floating in zero gravity with his apple.",
    },
    {
        title: "Apple dog in a high-speed chase. $apple",
        prompt: "Generate a video of apple dog racing through city streets, apple in tow.",
    },
    {
        title: "Apple dog in a fairytale castle. $apple",
        prompt: "Generate a video of apple dog exploring a magical castle filled with apples.",
    },
    {
        title: "Apple dog’s apple pie adventure. $apple",
        prompt: "Generate a video of apple dog baking an apple pie in a whimsical kitchen.",
    },
    {
        title: "Apple dog and the golden apple. $apple",
        prompt: "Generate a video of apple dog discovering a legendary golden apple in a hidden temple.",
    },
    {
        title: "Apple dog in a time machine. $apple",
        prompt: "Generate a video of apple dog traveling through history with his apple.",
    },
    {
        title: "Apple dog on a roller coaster. $apple",
        prompt: "Generate a video of apple dog enjoying a thrilling roller coaster ride.",
    },
    {
        title: "Apple dog in a jazz club. $apple",
        prompt: "Generate a video of apple dog playing the saxophone in a smoky jazz club.",
    },
    {
        title: "Apple dog in a detective story. $apple",
        prompt: "Generate a video of apple dog solving mysteries in a noir-style city.",
    },
    {
        title: "Apple dog as a racecar driver. $apple",
        prompt: "Generate a video of apple dog speeding down the racetrack with his apple helmet.",
    },
    {
        title: "Apple dog’s underwater adventure. $apple",
        prompt: "Generate a video of apple dog exploring a vibrant coral reef.",
    },
    {
        title: "Apple dog on a snowy mountain. $apple",
        prompt: "Generate a video of apple dog snowboarding down a mountain with his apple.",
    },
    {
        title: "Apple dog in a circus. $apple",
        prompt: "Generate a video of apple dog performing tricks under the big top.",
    },
    {
        title: "Apple dog in a candy factory. $apple",
        prompt: "Generate a video of apple dog creating apple-shaped candies.",
    },
    {
        title: "Apple dog in a futuristic robot battle. $apple",
        prompt: "Generate a video of apple dog piloting a robot in an epic battle.",
    },
    {
        title: "Apple dog at a farmer’s market. $apple",
        prompt: "Generate a video of apple dog selecting the freshest apples.",
    },
    {
        title: "Apple dog as a chef. $apple",
        prompt: "Generate a video of apple dog cooking up gourmet apple dishes.",
    },
    {
        title: "Apple dog at a rock concert. $apple",
        prompt: "Generate a video of apple dog playing guitar on stage.",
    },
    {
        title: "Apple dog on a camping trip. $apple",
        prompt: "Generate a video of apple dog roasting apples over a campfire.",
    },
    {
        title: "Apple dog as a painter. $apple",
        prompt: "Generate a video of apple dog painting a masterpiece of an apple orchard.",
    },
    {
        title: "Apple dog in a haunted house. $apple",
        prompt: "Generate a video of apple dog exploring a spooky haunted house.",
    },
    {
        title: "Apple dog in a gladiator arena. $apple",
        prompt: "Generate a video of apple dog battling with a foam apple shield.",
    },
    {
        title: "Apple dog in a kite festival. $apple",
        prompt: "Generate a video of apple dog flying a kite shaped like an apple.",
    },
    {
        title: "Apple dog as a lifeguard. $apple",
        prompt: "Generate a video of apple dog saving the day at the beach.",
    },
    {
        title: "Apple dog in a dance-off. $apple",
        prompt: "Generate a video of apple dog competing in a dance battle.",
    },
    {
        title: "Apple dog on a train journey. $apple",
        prompt: "Generate a video of apple dog enjoying a scenic train ride.",
    },
    {
        title: "Apple dog in an arcade. $apple",
        prompt: "Generate a video of apple dog playing retro games and winning prizes.",
    },
    {
        title: "Apple dog as an astronaut. $apple",
        prompt: "Generate a video of apple dog launching a rocket with his apple onboard.",
    },
    {
        title: "Apple dog on a safari. $apple",
        prompt: "Generate a video of apple dog exploring the savanna and spotting wildlife.",
    },
    {
        title: "Apple dog as a magician. $apple",
        prompt: "Generate a video of apple dog performing magic tricks with apples.",
    },
    {
        title: "Apple dog in a fantasy realm. $apple",
        prompt: "Generate a video of apple dog wielding an enchanted apple sword.",
    },
    {
        title: "Apple dog as a mail carrier. $apple",
        prompt: "Generate a video of apple dog delivering letters and apples to friends.",
    },
    {
        title: "Apple dog at a hot air balloon festival. $apple",
        prompt: "Generate a video of apple dog flying in an apple-shaped balloon.",
    },
    {
        title: "Apple dog in a superhero movie. $apple",
        prompt: "Generate a video of apple dog saving the world with his apple powers.",
    },
    {
        title: "Apple dog’s treasure island adventure. $apple",
        prompt: "Generate a video of apple dog searching for buried apple treasure.",
    },
    {
        title: "Apple dog at a zoo. $apple",
        prompt: "Generate a video of apple dog befriending animals at the zoo.",
    },
    {
        title: "Apple dog in a cooking competition. $apple",
        prompt: "Generate a video of apple dog winning a cooking contest with his apple dish.",
    },
    {
        title: "Apple dog in a castle siege. $apple",
        prompt: "Generate a video of apple dog defending a castle with his apple launcher.",
    },
    {
        title: "Apple dog at a science fair. $apple",
        prompt: "Generate a video of apple dog inventing an apple-powered engine.",
    },
    {
        title: "Apple dog in a wizard duel. $apple",
        prompt: "Generate a video of apple dog casting apple-themed spells.",
    },
    {
        title: "Apple dog in a skateboard park. $apple",
        prompt: "Generate a video of apple dog doing tricks on a skateboard with an apple logo.",
    },
    {
        title: "Apple dog as a florist. $apple",
        prompt: "Generate a video of apple dog arranging flowers with apple accents.",
    },
    {
        title: "Apple dog in a waterpark. $apple",
        prompt: "Generate a video of apple dog sliding down water slides with his apple.",
    },
    {
        title: "Apple dog in a theme park. $apple",
        prompt: "Generate a video of apple dog enjoying rides and eating caramel apples.",
    },
    {
        title: "Apple dog as a pilot. $apple",
        prompt: "Generate a video of apple dog flying a plane through apple-shaped clouds.",
    },
    {
        title: "Apple dog at a charity event. $apple",
        prompt: "Generate a video of apple dog raising funds with apple-themed activities.",
    },
    {
        title: "Apple dog on a treasure hunt. $apple",
        prompt: "Generate a video of apple dog solving puzzles to find a golden apple.",
    },
    {
        title: "Apple dog in a comic book. $apple",
        prompt: "Generate a video of apple dog as a comic book hero.",
    },
];
