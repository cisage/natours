class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //BASIC FILTERING
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // In javascript a variable is always pass by reference even when declaring one variable to another
    //so the only way to actually make a new variable without actually altering the contents of the original variable is
    //to use {...to} this will destructure all the elements of the object and return a new object with the same elements

    //these excluded fields will have different functionality
    //we dont want these fields to interefere with the fields that are actually important to filter our data
    //----------------------------------------------------------------------------------------------------------------------------

    //ADVANCED FILTERING

    //{ duration: { gte: '5' }, difficulty: 'easy' }
    //{ duration: { $gte: '5' }, difficulty: 'easy' }
    //the second one is what we need for mongodb

    let queryObjString = JSON.stringify(queryObj);
    queryObjString = queryObjString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    //to replace any four strings we put them in or expression
    //separated by \b which signifies exactly these strings will be replaced
    //g - to replace every occurence of the word
    //this replace takes a callback function which takes in the matched string and returns what it needs to be replaced with
    //-------------------------------------------------------------------------------------------------

    //FETCHING DATA
    //if you wanna chain methods you need to use let
    this.query.find(JSON.parse(queryObjString));
    //-------------------------------------------------------------
  }

  sort() {
    //SORTING
    //for sorting we are gonna chain a method on the query object
    if (this.queryString.sort) {
      this.queryString.sort = this.queryString.sort.replace(
        /(,)/g,
        (match) => ' '
      );
      //console.log(this.queryString);
      this.query = this.query.sort(this.queryString.sort);

      //to sort with multiple attributes in mongoose
      //
    } else {
      this.queryString.sort = '-createdAt';
      this.query = this.query.sort(this.queryString.sort);
    }
  }

  limit() {
    //LIMITING FIELDS
    if (this.queryString.fields) {
      this.queryString.fields = this.queryString.fields.split(',').join(' ');

      //mongoose expects .select('name price durating')
      //projection
    } else {
      this.queryString.fields = '-__v';
      //minus is for exclusion
    }
    this.query = this.query.select(this.queryString.fields);
    //-----------------------------------------------------------------------------
  }

  pagination() {
    //PAGINATION

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 20;
    const skip = (page - 1) * limit;
    //default values if user doesnt define anything
    //page=2&limit=10
    //that means that page 1 is 1-10
    //page 2 is 11-20
    //skip will skip the no of documents specified
    //so if we its written page 2 and limit =10 that means page 2 must contain 10 documents and we have to skip documents 1-10
    this.query = this.query.skip(skip).limit(limit);

    //---------------------------------------------------------------------------------------------------------------------------------------
  }
}

module.exports = APIFeatures;
