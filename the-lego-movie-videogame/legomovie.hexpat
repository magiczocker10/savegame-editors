u8 ChallengeCounter = 0;
u8 LvlCounter = 0;

import std.mem;
import std.string;

struct header_t {
	u32 crc32 @ 0x00;
	u8 lastPlayedOffset1 @ 0x06;
	u8 lastPlayedOffset2 @ 0x454;
	char signature[16] @ 0x08;
	u8 musicMicrophoneOffset @ 0x18;
	u8 languageOffset @ 0x19;
	u8 profileSelectionOffset @ 0x1A;
};

struct YellowStoneOffset {
	u24 yellowStoneOffset;
	padding[5];
	LvlCounter += 1;
}[[
	comment("Level #" + std::string::to_string(LvlCounter)),
	name("Level #" + std::string::to_string(LvlCounter))
]];

struct ChallengeOffset {
	u8 challenges;
	ChallengeCounter += 1;
}[[
	comment("Challenge #" + std::string::to_string(ChallengeCounter)),
	name("Challenge #" + std::string::to_string(ChallengeCounter))
]];
struct ChallengeLvls {
	ChallengeOffset challengeoffset[10];
	ChallengeCounter = 0;
	LvlCounter += 1;
}[[
	comment("Level #" + std::string::to_string(LvlCounter)),
	name("Level #" + std::string::to_string(LvlCounter))
]];

struct profile1_t { // profile starts at 28
	padding[8];
	ChallengeLvls challengelvls[45];
	padding[94];
	u24 blueStoneOffset;
	padding[13];
	LvlCounter = 0;
	YellowStoneOffset yellowstoneoffset[45];	
	padding[213];
	u32 upgradeOffset;
	padding[3];
	u8 characterOffset[23];
	padding[17];
	u8 sectionUnlockOffset[23];
	padding[37];
};

struct Chunks {
	profile1_t profile1_chunk [[comment("Profile 1")]];
	profile1_t profile2_chunk [[comment("Profile 2")]];
};

header_t header @ 0x00 [[comment("Contains the data outside the profiles."), name("Main game")]];
Chunks chunks @ 0x1C [[comment("Contains the data of each profile."), name("Profiles")]];