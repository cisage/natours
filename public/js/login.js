const login = async (email, password) => {
  //console.log(email, password);
  try {
    //in axios if an error is sent back as response then we can use catch that error on the client side
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        //whatever we put in data is sent as req.body
        email: email,
        password: password,
      },
    });
    if (res.data.status === 'success') {
      alert('Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
        //to navigate to '/' after 1 sec
      }, 1000);
    }
    //dont need an else because the if there is an error
    //we will automatically get sent to catch block
  } catch (err) {
    alert(err.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      window.setTimeout(() => {
        location.assign('/');
        //to navigate to '/' after 1 sec
      }, 1000);
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};

const formElement = document.querySelector('.form--login');
if (formElement) {
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
  //querySelector selects on the basis of the class
}

const logoutEle = document.querySelector('.nav__el--logout');
if (logoutEle) {
  logoutEle.addEventListener('click', logout);
}
