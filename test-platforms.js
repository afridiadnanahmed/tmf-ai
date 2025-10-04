// Test script to verify platforms are loaded
async function test() {
  try {
    // Import using dynamic import for ES modules
    const platformsModule = await import('./lib/integrations/platforms-config.ts');
    console.log('ALL_PLATFORMS exists:', !!platformsModule.ALL_PLATFORMS);
    console.log('Platform count:', platformsModule.ALL_PLATFORMS?.length || 0);
    if (platformsModule.ALL_PLATFORMS?.length > 0) {
      console.log('First platform:', platformsModule.ALL_PLATFORMS[0].name);
    }
  } catch (error) {
    console.error('Error importing platforms:', error.message);
  }
}

test();