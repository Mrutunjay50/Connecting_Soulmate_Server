const User = require('../models/Users');

exports.registerUser = async (req, res) => {
  try {
    const { page } = req.params;
    const { userId } = req.body; // Assuming you have a userId to identify the user

    // Fetch the user based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Based on the page number, update the corresponding array
    switch (page) {
      case '1':
        user.basicDetails.push(req.body.basicDetails);
        break;
      case '2':
        user.additionalDetails.push(req.body.additionalDetails);
        break;
      case '3':
        user.carrierDetails.push(req.body.carrierDetails);
        break;
      case '4':
        user.familyDetails.push(req.body.familyDetails);
        break;
      case '5':
        user.selfDetails.push(req.body.selfDetails);
        break;
      case '6':
        user.partnerPreference.push(req.body.partnerPreference);
        break;
      default:
        return res.status(400).json({ error: 'Invalid page number' });
    }

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'Data added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};