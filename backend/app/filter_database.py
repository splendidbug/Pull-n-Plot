import os
import pandas as pd
from flask import current_app
from rapidfuzz import fuzz
from app import db
from app.models import CombinedFilteredData
import pandas.api.types as ptypes
from sqlalchemy import and_, or_


def fuzzy_match(row_value, queries, threshold=80):
    """
    Fuzzy matches queries with rows. Return the matches if it's above the theeshold

    # Arguments
    - row_value: list of values from which query values will be compared against
    - queries: list of queries entered by the user to match with actual values
    - threshold: fuzzy match threshold  
    """

    row_value_lower = row_value.lower()
    return any(fuzz.ratio(row_value_lower, q) >= threshold for q in queries)


def add_merged_data_to_db(task_id, merged_df):
    """
    Add merged dataframe to CombinedFilteredData

    # Arguments
    - task_id: task id
    - merged_df: pandas dataframe to add to database
    """

    col_type_dict = {
        col: ptypes.is_categorical_dtype(
            merged_df[col]) or ptypes.is_object_dtype(merged_df[col])
        for col in merged_df.columns
    }
    for row_number, row in merged_df.iterrows():
        for col_name, value in row.items():
            record = CombinedFilteredData(
                task_id=task_id,
                row_id=row_number,
                is_categorical=col_type_dict[col_name],
                column_name=col_name,
                column_value=value
            )
            db.session.add(record)

    db.session.commit()


def join_dfs(all_filtered_data):
    """
    Perform full outer join on dataframes based on common columns. Returns merged dataframe 

    # Arguments
    - all_filtered_data: dictionary where key is soruce name value is the dataframe
    """

    common_cols = set.intersection(*(set(df.columns)
                                   for df in all_filtered_data.values()))
    common_cols = list(common_cols)

    # Perform full outer join sequentially
    from functools import reduce

    merged_df = reduce(
        lambda left, right: pd.merge(left, right, on=common_cols, how='outer'),
        all_filtered_data.values()
    )
    return merged_df


def apply_filters_and_merge(task_id, data_sources, task_filters):
    """
    Perform filter on every data source based on selected filters. Then, merge and add to db.
    (optional) Filter categorical columns based on `values` in task_filters based on fuzzy matching
    (optional) Filter numerical columns based on `from` and `to` in task_filters
    Merge and add to database after optional filtering

    # Arguments
    - task_id: task id
    - data_sources: dictionary of selected sources (`selectedSource`) and selected fields (`selectedFields`)
    - task_filters: dictionary of column names, value/from-to filters
    """

    data_dir = os.path.join(current_app.root_path, '..', 'sample_data')

    all_filtered_data = {}

    for ds in data_sources:
        source_name = ds["selectedSource"]
        selected_fields = ds.get("selectedFields", [])

        file_path = os.path.join(data_dir, source_name)

        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        if ext == ".csv":
            df = pd.read_csv(file_path)
        elif ext == ".json":
            df = pd.read_json(file_path)

        # filter columns
        filtered_df = df[selected_fields] if selected_fields else df

        filters = next(
            (item['fieldFilters']
             for item in task_filters if item['source'] == source_name),
            None  # default if not found
        )
        if filters:
            for field, condition in filters.items():
                # Handle numeric range filter
                if "from" in condition or "to" in condition:
                    filtered_df[field] = pd.to_numeric(
                        filtered_df[field], errors="coerce")

                    from_val = condition.get("from")
                    to_val = condition.get("to")

                    if from_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] >= float(
                            from_val)]
                    if to_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] <= float(
                            to_val)]

                # Handle categorical values filter - do fuzzy matching
                elif "values" in condition:
                    query_values = [val.lower() for val in condition['values']]
                    filtered_df = filtered_df[filtered_df[field].apply(
                        lambda x: fuzzy_match(x, query_values))]

        all_filtered_data[source_name] = filtered_df

    merged_df = join_dfs(all_filtered_data)
    add_merged_data_to_db(task_id, merged_df)


def filter_records(selected_fields, filters):
    """
    Pivot based on `task_id` and `row_id`, perform filter and return a dataframe of filtered values

    # Argument:
    - selected_fields: list of fields to filter
    - filters: value/from-to filters - value for categorical and form, to for numeric
    """

    query = CombinedFilteredData.query.filter(
        CombinedFilteredData.column_name.in_(selected_fields)
    )
    rows = query.all()

    df = pd.DataFrame([{
        "row_id": row.row_id,
        "task_id": row.task_id,
        "column_name": row.column_name,
        "column_value": row.column_value
    } for row in rows])

    df = df.pivot(
        index=["task_id", "row_id"],
        columns="column_name",
        values="column_value",
    ).reset_index()

    for col, condition in filters.items():
        if col not in df.columns:
            continue

        # Numeric filtering
        if "from" in condition or "to" in condition:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            if "from" in condition:
                df = df[df[col] >= float(condition["from"])]
            if "to" in condition:
                df = df[df[col] <= float(condition["to"])]

        # Fuzzy categorical filtering
        elif "values" in condition and condition["values"]:
            df = df[
                df[col].apply(lambda val: fuzzy_match(
                    str(val), condition["values"]))
            ]

    df = df.drop('row_id', axis=1)
    df.drop_duplicates(inplace=True)
    return df
