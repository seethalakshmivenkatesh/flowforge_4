const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/ApiResponse');

// @route GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).select('name email avatar role').sort('name');
  success(res, 200, 'Users fetched successfully', { users, count: users.length });
});

module.exports = { getUsers };
