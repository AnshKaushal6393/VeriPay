function getPrismaErrorDetails(error) {
  const rawMessage = error?.message || ''

  if (error?.code === 'P1001') {
    return {
      status: 503,
      message: 'Database connection failed',
      details:
        'The server could not reach the configured database. Verify DATABASE_URL and database availability.',
    }
  }

  if (error?.code === 'P1000') {
    return {
      status: 503,
      message: 'Database authentication failed',
      details:
        'The database credentials were rejected. Check the username and password in DATABASE_URL.',
    }
  }

  if (
    rawMessage.includes("Can't reach database server") ||
    rawMessage.includes('DatabaseNotReachable')
  ) {
    return {
      status: 503,
      message: 'Database connection failed',
      details:
        'The server could not reach the configured database host. Verify DATABASE_URL, Neon project status, and network access.',
    }
  }

  return {
    status: 500,
    message: 'Internal server error',
    details: error?.message || 'Unexpected server error',
  }
}

module.exports = {
  getPrismaErrorDetails,
}
