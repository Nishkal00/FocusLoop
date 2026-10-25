export const mockTasks = {
  "doing-laundry": {
    id: "doing-laundry",
    title: "Doing Laundry",
    description: "Wash and dry your clothes step-by-step without getting overwhelmed.",
    category: "Household",
    difficulty: "Medium",
    estimatedTime: "15 mins active",
    steps: [
      {
        id: "laundry-1",
        title: "Gather and Sort Clothes",
        description: "Collect your clothes. Separate them into two piles: Whites (shirts, socks, towels that are white) and Darks/Colors.",
        prompt: "A close-up shot of a person sorting colorful clothes and white laundry into two distinct piles on a clean wooden table, soft focus, bright natural light, photorealistic.",
        videoUrl: "/laundry.mp4",
        duration: 120,
        subtasks: [
          "Grab your laundry hamper",
          "Put whites in pile A",
          "Put darks and colors in pile B"
        ]
      },
      {
        id: "laundry-2",
        title: "Load the Washing Machine",
        description: "Choose one pile to wash first. Open the washer door, put the clothes inside (don't overstuff it, leave some space at the top), and close the door.",
        prompt: "A shot of hands gently placing dark clothes into an open front-load washing machine, high detail, warm colors, cinematic lighting.",
        videoUrl: "/generic.mp4",
        duration: 90,
        subtasks: [
          "Open the washer door",
          "Place one pile of sorted clothes inside",
          "Check that there is some empty space at the top",
          "Shut the door firmly until it clicks"
        ]
      },
      {
        id: "laundry-3",
        title: "Add Detergent & Start",
        description: "Measure detergent (usually to line 1 or 2 on the cap). Pour it into the drawer or directly on clothes. Select 'Normal' cycle, 'Cold' temperature, and press the Start button.",
        prompt: "Close-up of liquid laundry detergent pouring slowly from a blue bottle cap into a washing machine dispenser drawer, clean aesthetic, slow motion.",
        videoUrl: "/coffee.mp4",
        duration: 60,
        subtasks: [
          "Fill detergent cup to the marked line",
          "Pour detergent into the detergent tray",
          "Turn dial to 'Normal' or 'Eco'",
          "Set temperature to 'Cold'",
          "Press the Start button"
        ]
      },
      {
        id: "laundry-4",
        title: "Set a Reminder",
        description: "Washing takes about 45 minutes. Set an alarm on your phone right now so you don't forget the clothes in the machine.",
        prompt: "A smartphone lying on a desk displaying a running timer app for 45 minutes, with soft ambient light, shallow depth of field.",
        videoUrl: "/desk.mp4",
        duration: 45,
        subtasks: [
          "Open your phone's clock app",
          "Create a new alarm for 45 minutes from now",
          "Label the alarm 'Move laundry to dryer'"
        ]
      }
    ]
  },
  "making-coffee": {
    id: "making-coffee",
    title: "Making Morning Coffee",
    description: "Brew a refreshing cup of coffee to start your day with focus.",
    category: "Morning Routine",
    difficulty: "Easy",
    estimatedTime: "5 mins",
    steps: [
      {
        id: "coffee-1",
        title: "Fill the Water Reservoir",
        description: "Take your coffee pot or mug, fill it with cold water, and pour it into the back water tank of the coffee maker.",
        prompt: "Pouring clear water from a glass pitcher into the clean reservoir of a black coffee maker machine, high detail, studio lighting.",
        videoUrl: "/coffee.mp4",
        duration: 45,
        subtasks: [
          "Fill coffee pot with cold tap water",
          "Open the coffee maker lid",
          "Pour water into the reservoir tank",
          "Close the lid"
        ]
      },
      {
        id: "coffee-2",
        title: "Insert Coffee and Filter",
        description: "Open the filter basket. Put a paper filter inside (or use the reusable mesh filter). Add 2 scoops of coffee grounds.",
        prompt: "A person using a scoop to add dark ground coffee into a paper filter inside a coffee machine basket, macro shot, photorealistic.",
        videoUrl: "/generic.mp4",
        duration: 60,
        subtasks: [
          "Open the filter basket chamber",
          "Place filter flat inside the holder",
          "Scoop ground coffee (2 tablespoons)",
          "Pour coffee grounds into the filter",
          "Close the filter basket"
        ]
      },
      {
        id: "coffee-3",
        title: "Start Brewing",
        description: "Place the empty coffee pot on the heating plate, plug in the machine, and press the Power switch.",
        prompt: "A finger pressing the red glowing power switch of a coffee machine, starting the brewing process, cozy morning vibe.",
        videoUrl: "/laundry.mp4",
        duration: 30,
        subtasks: [
          "Ensure coffee pot is sitting on the hot plate",
          "Make sure machine is plugged into the wall",
          "Flip power switch to 'ON'"
        ]
      },
      {
        id: "coffee-4",
        title: "Pour and Enjoy",
        description: "Wait until the dripping stops. Grab your favorite mug, pour the hot coffee, add milk or sugar if you like, and sit down to enjoy.",
        prompt: "Freshly brewed hot coffee pouring from a glass carafe into a white ceramic mug, steam rising, warm morning sunlight, slow motion.",
        videoUrl: "/desk.mp4",
        duration: 90,
        subtasks: [
          "Wait for dripping to completely stop",
          "Pour coffee into your mug",
          "Add cream/sugar (optional) and stir",
          "Take a slow breath and enjoy your first sip"
        ]
      }
    ]
  },
  "cleaning-desk": {
    id: "cleaning-desk",
    title: "Clearing Your Desk",
    description: "Remove clutter and create a clean, distraction-free environment to help you focus.",
    category: "Productivity",
    difficulty: "Easy",
    estimatedTime: "8 mins",
    steps: [
      {
        id: "desk-1",
        title: "Clear Trash and Dishes",
        description: "Look for any empty wrappers, old notes, cups, or bowls. Put trash in the bin and take dishes to the sink.",
        prompt: "A hand picking up empty soda cans and paper wrappers from a cluttered computer desk and placing them in a recycling bin, photorealistic.",
        videoUrl: "/laundry.mp4",
        duration: 120,
        subtasks: [
          "Pick up all wrappers/scraps and throw them away",
          "Gather any cups or plates",
          "Take dishes to the kitchen sink"
        ]
      },
      {
        id: "desk-2",
        title: "Organize Papers & Cables",
        description: "Gather loose papers into one neat stack. Put pens in a drawer or cup. Untangle keyboard/charger cables.",
        prompt: "Arranging loose papers and notebooks into a neat stack next to a laptop on a desk, clean minimalist look, high dynamic range.",
        videoUrl: "/generic.mp4",
        duration: 180,
        subtasks: [
          "Stack notebooks and loose paper sheet together",
          "Put pens/pencils back in their holder or drawer",
          "Neatly bundle charger cables"
        ]
      },
      {
        id: "desk-3",
        title: "Wipe Down the Surface",
        description: "Spray a small amount of desk cleaner or use a sanitizing wipe to clean the dust and spots off your desk.",
        prompt: "A micro-fiber cloth wiping down a dark wooden desk surface, removing dust and leaving it clean and shiny, smooth movement.",
        videoUrl: "/desk.mp4",
        duration: 90,
        subtasks: [
          "Move keyboard and mouse to the side",
          "Use a wet wipe or spray cleaner with a towel",
          "Wipe in long, steady strokes",
          "Put keyboard and mouse back"
        ]
      }
    ]
  },
  "making-bed": {
    id: "making-bed",
    title: "Making My Bed",
    description: "Tidy up your sleeping area step-by-step to start your day with an organized mind.",
    category: "Morning Routine",
    difficulty: "Easy",
    estimatedTime: "4 mins",
    steps: [
      {
        id: "bed-1",
        title: "Strip and Sort Bedding",
        description: "Pull off the pillows, blankets, and any loose clothes. Set them on a nearby chair to clear the surface of the mattress.",
        prompt: "A close-up shot of a person picking up blankets and pillows off an unmade bed and placing them on a wooden chair, bright bedroom context, slow motion.",
        videoUrl: "/laundry.mp4",
        duration: 60,
        subtasks: [
          "Place pillows on a chair or clean floor space",
          "Remove heavy blankets or duvets",
          "Shake out the sheets to clear any wrinkles"
        ]
      },
      {
        id: "bed-2",
        title: "Straighten the Fitted Sheet",
        description: "Go around the bed and pull the fitted sheet tight over each of the four corners of your mattress.",
        prompt: "Hands pulling the corner of a clean blue fitted bedsheet tightly over the mattress corner, cinematic lighting, slow motion.",
        videoUrl: "/generic.mp4",
        duration: 90,
        subtasks: [
          "Check corner 1 and pull down tight",
          "Check corner 2 and pull down tight",
          "Tuck in any loose edges along the sides"
        ]
      },
      {
        id: "bed-3",
        title: "Layer Blankets & Fluff Pillows",
        description: "Pull your top blanket or duvet up to the head of the bed. Smooth it out with your hands. Fluff your pillows by patting the sides, and place them neatly at the top.",
        prompt: "Hands shaking a white duvet and smoothing it out on a bed, placing two fluffed pillows at the top, tidy minimalist bedroom, warm lighting.",
        videoUrl: "/desk.mp4",
        duration: 90,
        subtasks: [
          "Pull the duvet all the way up",
          "Smooth out major wrinkles with your hands",
          "Give pillows 2 quick squeezes to fluff them",
          "Lay pillows side-by-side at the head of the bed"
        ]
      }
    ]
  },
  "brushing-teeth": {
    id: "brushing-teeth",
    title: "Brushing Your Teeth",
    description: "Keep your teeth healthy and clean with a focused 2-minute routing.",
    category: "Morning Routine",
    difficulty: "Easy",
    estimatedTime: "3 mins",
    steps: [
      {
        id: "brush-1",
        title: "Prepare Your Toothbrush",
        description: "Wet the bristles of your toothbrush under the faucet. Squeeze a pea-sized amount of toothpaste onto the brush.",
        prompt: "A hand holding a toothbrush under running water from a modern faucet, then squeezing toothpaste onto it, close-up, water drops splashing, photorealistic.",
        videoUrl: "/coffee.mp4",
        duration: 30,
        subtasks: [
          "Turn on the tap briefly to wet the brush",
          "Open the toothpaste cap",
          "Squeeze a pea-sized dot of paste onto the bristles",
          "Close the toothpaste cap"
        ]
      },
      {
        id: "brush-2",
        title: "Brush All Surfaces",
        description: "Start brushing! Move the brush in gentle circles. Make sure to cover the front, back, and chewing surfaces of your teeth.",
        prompt: "Close up shot of a toothbrush brushing teeth, clean bathroom background, high resolution, macro lens.",
        videoUrl: "/generic.mp4",
        duration: 120,
        subtasks: [
          "Brush upper teeth (front and back) for 30s",
          "Brush lower teeth (front and back) for 30s",
          "Brush chewing surfaces of molars for 30s",
          "Brush your tongue gently for 10s"
        ]
      },
      {
        id: "brush-3",
        title: "Rinse and Clean Up",
        description: "Spit out the toothpaste, rinse your mouth with a cup of water, and wash off your toothbrush bristles under the tap.",
        prompt: "A clean toothbrush being rinsed under running tap water in a white sink, high detail, studio lighting.",
        videoUrl: "/desk.mp4",
        duration: 30,
        subtasks: [
          "Spit out excess foam",
          "Rinse your mouth with water and spit",
          "Rinse toothbrush head thoroughly",
          "Place toothbrush back in holder"
        ]
      }
    ]
  }
};
