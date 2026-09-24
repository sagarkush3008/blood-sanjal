import app from './app';

const PORT = process.env.PORT || 4000;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server run hogail benchod ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to boot server', error);
    process.exit(1);
  }
};

startServer();
