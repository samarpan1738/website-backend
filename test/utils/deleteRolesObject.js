const firestore = require("../../utils/firestore");
const userCollection = firestore.collection("users");

/**
 * Deletes the entire roles object for a user
 * @param {string} userId - to identify the user whose roles are to be deleted
 * @return {boolean} success - are roles deleted or not
 */
module.exports = async (userId = null) => {
  if (!userId) return false;

  try {
    const userDoc = await userCollection.doc(userId).get();

    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    delete userData.roles;
    await userCollection.doc(userId).set(userData);

    return true;
  } catch (error) {
    logger.error(`Error deleting user's roles object: ${error}`);
    return false;
  }
};
