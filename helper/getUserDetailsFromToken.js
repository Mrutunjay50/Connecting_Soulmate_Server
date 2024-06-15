const jwt = require('jsonwebtoken')
const User = require('../models/Users')

const getUserDetailsFromToken = async(token)=>{
    
    if(!token){
        return {
            message : "session out",
            logout : true,
        }
    }

    const decode = await jwt.verify(token,process.env.JWT_SECREAT_KEY)

    const user = await User.findById(decode.id)

    return user
}

module.exports = getUserDetailsFromToken