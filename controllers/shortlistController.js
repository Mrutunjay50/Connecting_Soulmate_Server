const { InterestRequests, ProfileRequests } = require("../models/interests");
const ShortList = require("../models/shortlistUsers");
const { ListData } = require("../helper/cardListedData");

exports.addToShortlist = async (req, res) => {
    try {
      const { user, shortlistedUserId } = req.body;
  
      // Check if a shortlist entry already exists for the user and shortlisted user
      const existingShortlist = await ShortList.findOne({
        user: user,
        shortlistedUser: shortlistedUserId,
      });
  
      if (existingShortlist) {
        // If the entry already exists, delete it
        await existingShortlist.remove();
        res.status(200).json({ message: "User removed from shortlist" });
  
        // Update isShortListedTo and isShortListedBy to 'no' in profile and interest requests
        await Promise.all([
          ProfileRequests.updateMany(
            { profileRequestBy: user, profileRequestTo: shortlistedUserId },
            { isShortListedBy: 'no' }
          ),
          InterestRequests.updateMany(
            { interestRequestBy: user, interestRequestTo: shortlistedUserId },
            { isShortListedBy: 'no' }
          )
        ]);
      } else {
        // If the entry doesn't exist, create a new one
        const shortlist = new ShortList({
          user: user,
          shortlistedUser: shortlistedUserId,
        });
  
        await shortlist.save();
  
        res.status(201).json({ message: "User added to shortlist successfully" });
  
        // Update isShortListedTo and isShortListedBy to 'yes' in profile and interest requests
        await Promise.all([
          ProfileRequests.updateMany(
            { profileRequestBy: user, profileRequestTo: shortlistedUserId },
            { isShortListedBy: 'yes' }
          ),
          InterestRequests.updateMany(
            { interestRequestBy: user, interestRequestTo: shortlistedUserId },
            { isShortListedBy: 'yes' }
          ),
        ]);
      }
    } catch (error) {
      console.error("Error adding user to shortlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  

exports.getShortlistedUser = async (req, res) => {
    try {
      const { UserId } = req.params;
      const user = await ShortList.find({ user: UserId }).populate({
        path: "shortlistedUser",
        select: ListData,
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching shortlisted user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };