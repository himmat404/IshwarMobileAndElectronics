const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple schema for admin user
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('🔧 Creating Admin User...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email: admin@example.com\n');
      
      // Ask if user wants to reset password
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Do you want to reset the password? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          const hashedPassword = await bcrypt.hash('admin123', 12);
          await User.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword });
          console.log('✅ Password reset successfully!');
          console.log('   Email: admin@example.com');
          console.log('   Password: admin123\n');
        } else {
          console.log('ℹ️  Password not changed\n');
        }
        readline.close();
        await mongoose.disconnect();
        process.exit(0);
      });
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    });

    console.log('🎉 Admin user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: admin123\n');
    console.log('⚠️  IMPORTANT: Change this password after first login!\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();